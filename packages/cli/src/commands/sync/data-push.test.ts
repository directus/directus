import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../../kernel/config/credentials.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { fetchRecords } from '../../sync/api.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { hasNaturalKey } from '../../sync/reconcile.js';
import { partitionCollections, prepareDataPush, previewData, remapSystemRecord } from './data-push.js';
import type { Target } from './resolve-target.js';

// Keep unit tests off the network. System reconcile fetches every committed collection's target rows and
// propagates any failure (a blind read must never assemble a batch), so the seam resolves empty: "the
// target has no rows", which lets preparation proceed while keeping every source row in the batch.
vi.mock('../../sync/api.js', () => ({
	fetchRecords: vi.fn(() => Promise.resolve([])),
	importBatch: vi.fn(),
}));

// hasNaturalKey gates the unmatched-numeric-PK withhold; one test flips it to false to reach the
// static-catalog guard (unreachable with the real table). Everything else stays real so reconciliation
// behaves as in production.
vi.mock('../../sync/reconcile.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../sync/reconcile.js')>();
	return { ...actual, hasNaturalKey: vi.fn(actual.hasNaturalKey) };
});

const bucket = {
	directus_access: { a1: 'ta1' },
	directus_roles: { sr: 'tr' },
	directus_policies: { sp: 'tp' },
	directus_folders: { fChild: 'tChild', fParent: 'tParent' },
};

describe('remapSystemRecord', () => {
	it('replaces the primary key and every static FK with its target-space id, reporting the send pair', () => {
		// The whole safety of a repeat import rests on this: a source record must land as its already-known
		// target record (PK) and point its FKs at the target's rows (role/policy), or the import duplicates
		// or dangles. The send pair is what push later writes back into the map from the import response.
		const { record, sent } = remapSystemRecord(
			{ id: 'a1', role: 'sr', policy: 'sp', user: null },
			'directus_access',
			'id',
			bucket,
		);

		expect(record).toEqual({ id: 'ta1', role: 'tr', policy: 'tp', user: null });
		expect(sent).toEqual({ sourceId: 'a1', sentPk: 'ta1' });
	});

	it('leaves an FK with no mapping verbatim — an in-batch new record or a genuine dangle, never a guess', () => {
		// A miss must not be invented: the referenced row may be a new record the server links in the same
		// batch, or a genuinely missing reference the server should reject loudly. Either way the CLI must
		// not fabricate a target id.
		const { record } = remapSystemRecord(
			{ id: 'a1', role: 'unmapped', policy: 'sp', user: null },
			'directus_access',
			'id',
			bucket,
		);

		expect(record['role']).toBe('unmapped');
		expect(record['policy']).toBe('tp');
	});

	it('leaves the primary key verbatim on a miss and reports sentPk as the source id', () => {
		// A first-import record has no mapping yet: it keeps its source PK (the server inserts and remaps),
		// and sentPk must be that source PK so push can pair it with the import response's remap.
		const { record, sent } = remapSystemRecord({ id: 'sr', name: 'Editor' }, 'directus_roles', 'id', bucket);

		expect(record['id']).toBe('tr');
		expect(sent).toEqual({ sourceId: 'sr', sentPk: 'tr' });

		const miss = remapSystemRecord({ id: 'new', name: 'New' }, 'directus_roles', 'id', bucket);
		expect(miss.record['id']).toBe('new');
		expect(miss.sent).toEqual({ sourceId: 'new', sentPk: 'new' });
	});

	it('remaps a folder onto its target id and its parent onto the target parent — the self-ref tree survives', () => {
		// directus_folders parents another folder, exactly like directus_roles. Without the parent FK in the
		// map a re-push keeps the source-space parent id, which names a different (or absent) folder on the
		// target — silently reparenting the media-library tree. This pins the self-ref FK entry as load-bearing.
		const { record, sent } = remapSystemRecord(
			{ id: 'fChild', name: 'Images', parent: 'fParent' },
			'directus_folders',
			'id',
			bucket,
		);

		expect(record).toEqual({ id: 'tChild', name: 'Images', parent: 'tParent' });
		expect(sent).toEqual({ sourceId: 'fChild', sentPk: 'tChild' });
	});

	it('never mutates the input record and leaves non-key fields untouched', () => {
		// The remap is pure — the on-disk record is owned by the store, and a mutation would corrupt a later
		// read or a second remap. Only the PK and static FK fields change; everything else passes through.
		const input = { id: 'sr', name: 'Editor', icon: 'shield', parent: null };
		const { record } = remapSystemRecord(input, 'directus_roles', 'id', bucket);

		expect(input.id).toBe('sr');
		expect(record).toEqual({ id: 'tr', name: 'Editor', icon: 'shield', parent: null });
	});
});

function content(collection: string): DataCollection {
	return { collection, primaryKey: 'id', records: [] };
}

describe('partitionCollections', () => {
	it('orders system collections dependencies-first and codepoint-sorts content after them', () => {
		// Keep system resources in the graph's import order and user content deterministic after them.
		const { system, content: contentOut } = partitionCollections([
			content('zebra'),
			content('directus_roles'),
			content('apple'),
			content('directus_access'),
			content('directus_policies'),
		]);

		expect(system.map((entry) => entry.data.collection)).toEqual([
			'directus_access',
			'directus_policies',
			'directus_roles',
		]);

		expect(contentOut.map((entry) => entry.collection)).toEqual(['apple', 'zebra']);
	});

	it('keeps a system collection without a natural key (directus_panels) in the system partition', () => {
		// panels has no natural key, so it is never reconciled — but it is still a graph member that must be
		// remapped (PK + dashboard FK), so it belongs in system, not content.
		const { system, content: contentOut } = partitionCollections([content('directus_panels'), content('notes')]);

		expect(system.map((entry) => entry.data.collection)).toEqual(['directus_panels']);
		expect(contentOut.map((entry) => entry.collection)).toEqual(['notes']);
	});
});

describe('prepareDataPush skip and precondition', () => {
	const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token: 't' };
	let dir: string;

	function target(): Target {
		return {
			url: 'https://cms.example.com',
			credential,
			project: 'default',
			schemaDir: join(dir, 'schema'),
			dataDir: join(dir, 'data'),
			idMapPath: join(dir, 'id_map.json'),
			projectConfig: undefined,
		};
	}

	function ctx(): CliContext {
		return { cwd: dir, configPath: undefined, interactive: false, ui: createUi({ json: false, color: false }) };
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-datapush-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
		// Vitest 3 mockReset restores the original empty-target implementation, so per-test target rows
		// (the ambiguity fixtures below) cannot leak into the next test's reconciliation.
		vi.mocked(fetchRecords).mockReset();
	});

	it('returns skipped when the data directory is absent (a schema-only checkout)', async () => {
		// Older checkouts committed schema without data; push must still run and report the data phase
		// skipped rather than failing. No credential is touched — the skip precedes any network work.
		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toEqual({ skipped: true });
	});

	it('returns skipped when the committed data set is empty', async () => {
		writeDataFiles(join(dir, 'data'), [], 'https://source.example.com');

		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toEqual({ skipped: true });
	});

	it('refuses loud when the committed data predates source tracking', async () => {
		// The source keys the ID map bucket; data written before it was recorded cannot be remapped safely,
		// so prepareDataPush propagates the store's STATE refusal rather than guessing a source.
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'r1' }] }],
			'https://source.example.com',
		);

		const metadataPath = join(dir, 'data', 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.source;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
	});

	it('refuses a data file whose declared primaryKey contradicts the catalog, before any network', async () => {
		// parseDataFile validates rows and dedups primary keys against the DECLARED key, but every consumer
		// downstream keys on the catalog's — a hand-edited `primaryKey: "name"` would make the duplicate-PK
		// guard watch the wrong column, so two rows with one real id could ship. The mismatch must refuse at
		// the boundary, before the target is even read; push and diff share this path.
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_roles', primaryKey: 'name', records: [{ id: 'r1', name: 'Editor' }] }],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockClear();

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
		expect((error as CliError).message).toContain('directus_roles');
		expect((error as CliError).message).toContain('"name"');
		expect((error as CliError).message).toContain('"id"');
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it('refuses an unknown directus_* data file as an unsynced system collection, not as content', async () => {
		// A hand-committed directus_presets file is a SYSTEM collection this CLI version has no catalog
		// entry for. The old refusal called it a "content collection", sending the operator down the
		// deferred-content path instead of toward removing the file or changing CLI versions. The refusal
		// must name it as system and precede any network work.
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_presets', primaryKey: 'id', records: [{ id: 1 }] }],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockClear();

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
		expect((error as CliError).message).toContain('system collections this CLI version does not sync');
		expect((error as CliError).message).toContain('directus_presets');
		expect((error as CliError).message).not.toMatch(/content collection/);
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it('throws STATE for an unmatched numeric PK on a resource without a natural key, never sending it', async () => {
		// The withhold strips unmatched numeric PKs precisely because a raw source integer silently upserts
		// whatever target row owns that id. A numeric-PK resource missing from NATURAL_KEYS would skip the
		// withhold and fall through to that raw-PK send — so the guard must fail the push, not the target's
		// data. Unreachable with today's catalog; this pins the invariant against catalog edits.
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_permissions',
					primaryKey: 'id',
					records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(hasNaturalKey).mockReturnValue(false);

		try {
			const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

			expect(error).toBeInstanceOf(CliError);
			expect((error as CliError).code).toBe('STATE');
			expect((error as CliError).message).toContain('directus_permissions');
			expect((error as CliError).message).toMatch(/natural key/i);
		} finally {
			// Vitest 3 mockReset restores the implementation originally passed to vi.fn — the real table.
			vi.mocked(hasNaturalKey).mockReset();
		}
	});

	it('previewData skips a schema-only checkout without touching the credential', async () => {
		// An absent data directory is a schema-only checkout: the preview skips exactly as the push path does,
		// before any network work.
		await expect(previewData(target(), 'merge')).resolves.toEqual({ skipped: true });
	});

	it('previewData excludes the dependents of an ambiguous source along with it, keeping unaffected rows', async () => {
		// The ambiguous role leaves the preview batch, but its access row still carries the role's SOURCE
		// id — a value that resolves to nothing: the role is out of the batch and unmapped on the target.
		// The server-side dry-run would fail on that reference, making diff error on a state an interactive
		// push handles fine. Both must drop and both must count as unresolved; the access row pointing at
		// the cleanly matched role must stay, FK remapped — dropping it too would hide a real change.
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					records: [
						{ id: 'r-amb', name: 'Editor' },
						{ id: 'r-ok', name: 'Viewer', icon: 'eye' },
					],
				},
				{
					collection: 'directus_access',
					primaryKey: 'id',
					records: [
						{ id: 'a-amb', role: 'r-amb', user: null, policy: null },
						{ id: 'a-ok', role: 'r-ok', user: null, policy: null },
					],
				},
			],
			'https://source.example.com',
		);

		// Two target roles named Editor make the source Editor ambiguous; Viewer matches uniquely.
		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/roles'
					? [
							{ id: 't-ed-1', name: 'Editor' },
							{ id: 't-ed-2', name: 'Editor' },
							{ id: 't-viewer', name: 'Viewer' },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			skipped: false,
			batch: [
				{ collection: 'directus_access', items: [{ id: 'a-ok', role: 't-viewer', user: null, policy: null }] },
				{ collection: 'directus_roles', items: [{ id: 't-viewer', name: 'Viewer', icon: 'eye' }] },
			],
			records: 2,
			matchedCount: 1,
			ambiguousCount: 2,
			unmatchedCount: 1,
		});
	});

	it('previewData drops a whole folder chain under an ambiguous parent, to a fixed point', async () => {
		// directus_folders references itself: the child's parent FK dangles once the ambiguous root is
		// excluded, and the grandchild's dangles once the child is. Records are ordered grandchild-first so
		// a single filtering pass provably misses the grandchild — only iterating to a fixed point empties
		// the subtree, and anything left behind fails the server-side dry-run on the parent reference.
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_folders',
					primaryKey: 'id',
					records: [
						{ id: 'f-grand', name: 'Icons', parent: 'f-child' },
						{ id: 'f-child', name: 'Images', parent: 'f-amb' },
						{ id: 'f-amb', name: 'Assets', parent: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/folders'
					? [
							{ id: 't-a1', name: 'Assets', parent: null },
							{ id: 't-a2', name: 'Assets', parent: null },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			skipped: false,
			batch: [{ collection: 'directus_folders', items: [] }],
			records: 0,
			matchedCount: 0,
			ambiguousCount: 3,
			unmatchedCount: 0,
		});
	});

	it('previewData excludes a matched child of an ambiguous parent and moves it out of matchedCount', async () => {
		// The child folder matches its target row by name, but its record still carries the ambiguous
		// parent's source id — sending it would UPDATE the matched target row with a dangling parent, the
		// exact reference failure the exclusion exists to prevent. It must leave the batch and count as
		// unresolved, not matched, so diff's totals partition the committed set.
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_folders',
					primaryKey: 'id',
					records: [
						{ id: 'f-amb', name: 'Assets', parent: null },
						{ id: 'f-child', name: 'Images', parent: 'f-amb' },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/folders'
					? [
							{ id: 't-a1', name: 'Assets', parent: null },
							{ id: 't-a2', name: 'Assets', parent: null },
							{ id: 't-img', name: 'Images', parent: 't-a1' },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			skipped: false,
			batch: [{ collection: 'directus_folders', items: [] }],
			records: 0,
			matchedCount: 0,
			ambiguousCount: 2,
			unmatchedCount: 0,
		});
	});

	it('previewData keeps a null-FK row when its collection has excluded rows', async () => {
		// Exclusion must fire only when an FK actually holds an excluded source id — a null parent
		// references nothing, so the row rides the batch as a create. Dropping it would silently shrink
		// the preview below what push would do.
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					records: [
						{ id: 'r-amb', name: 'Editor', parent: null },
						{ id: 'r-solo', name: 'Solo', parent: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/roles'
					? [
							{ id: 't-ed-1', name: 'Editor', parent: null },
							{ id: 't-ed-2', name: 'Editor', parent: null },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			skipped: false,
			batch: [{ collection: 'directus_roles', items: [{ id: 'r-solo', name: 'Solo', parent: null }] }],
			records: 1,
			matchedCount: 0,
			ambiguousCount: 1,
			unmatchedCount: 1,
		});
	});

	it('previewData assembles the batch, tallies the reconcile counts, and never writes the id map', async () => {
		// diff's preview must stay read-only: an unmatched flow rides the batch verbatim and counts as
		// pending, and — the invariant — no id_map.json appears; identity choices belong to push alone.
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }],
			'https://source.example.com',
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toEqual({
			skipped: false,
			source: 'https://source.example.com',
			batch: [{ collection: 'directus_flows', items: [{ id: 'f1', name: 'Deploy' }] }],
			unchanged: new Map(),
			records: 1,
			matchedCount: 0,
			ambiguousCount: 0,
			unmatchedCount: 1,
			unchangedCount: 0,
			incomplete: [],
		});

		expect(existsSync(join(dir, 'id_map.json'))).toBe(false);
	});
});
