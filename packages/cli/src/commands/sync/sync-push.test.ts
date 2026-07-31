import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snapshot } from '../../sync/contract.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import {
	decodeBatch,
	fullSnapshot,
	mockApply,
	mockApplyHashMismatch,
	mockDiff,
	mockImport,
	mockList,
	runSync,
	seedProjectConfig,
	SYNC_TOKEN,
	SYNC_URL,
	useSyncWorld,
} from './sync.test-support.js';

const world = useSyncWorld();
const url = SYNC_URL;
const token = SYNC_TOKEN;
let agent: MockAgent;
let dir: string;
let stdout: string[];
let stderr: string[];

beforeEach(() => {
	({ agent, dir, stdout, stderr } = world);
});

function d6s(...argv: string[]): Promise<number> {
	return runSync(dir, argv);
}

function seedConfig(): void {
	seedProjectConfig(dir);
}

function interceptList(path: string, records: Record<string, unknown>[]): void {
	mockList(agent, path, records);
}

const interceptTarget = interceptList;

function interceptDiff(
	mode: 'merge' | 'mirror',
	body: Record<string, unknown> | null,
	capture?: (body: unknown) => void,
): void {
	mockDiff(agent, mode, body, capture);
}

function interceptApply(capture?: (body: unknown) => void): void {
	mockApply(agent, capture);
}

function interceptImport(
	query: Record<string, string>,
	result: Record<string, unknown>,
	status = 200,
	capture?: (form: FormData) => void,
): void {
	mockImport(agent, query, result, status, capture);
}

describe('sync push', () => {
	let schemaDir: string;

	beforeEach(() => {
		schemaDir = join(dir, 'directus', 'default', 'schema');
	});

	function mergeDiffBody(): Record<string, unknown> {
		return {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [
				{
					collection: 'articles',
					field: 'title',
					diff: [{ kind: 'E', path: ['meta', 'note'], lhs: null, rhs: 'headline' }],
				},
			],
			systemFields: [],
			relations: [],
		};
	}

	it('applies the sealed diff and sends { hash, diff } to /schema/apply byte-for-byte', async () => {
		// The entire safety model rests on the exact diff the server sealed reaching /schema/apply
		// unmodified — the server re-checks that hash — so the apply body must deep-equal the { hash, diff }
		// the diff returned. Any mutation between diff and apply would break the seal.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());

		let applied: unknown;

		interceptApply((body) => {
			applied = body;
		});

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		expect(applied).toEqual({ hash: 'h1', diff: mergeDiffBody() });
	});

	it('prints the resolved target and mode on the human channel before the diff summary', async () => {
		// A profile named staging but pointing at prod's URL must be visible before anything mutates, so
		// the resolution line lands on stderr ahead of the change summary — and it carries the mode gloss,
		// because "mirror deletes" must never be a surprise learned at the refusal.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());
		interceptApply();

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		const err = stderr.join('');
		const resolutionAt = err.indexOf(`Pushing to staging — ${url} (merge — additive, no deletions)`);
		const summaryAt = err.indexOf('Schema — ');
		expect(resolutionAt).toBeGreaterThanOrEqual(0);
		expect(summaryAt).toBeGreaterThan(resolutionAt);
	});

	it('warns before apply when the committed schema references a collection it does not include', async () => {
		// A scoped export can strand a group parent the target lacks, and apply then 500s server-side
		// (server scoped-snapshot bug). Push must warn about the dangling reference before the apply so the
		// operator can widen scope, rather than only learning at the crash.
		const grouped: Snapshot = {
			version: 2,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'pages', meta: { group: 'website' } }],
			fields: [{ collection: 'pages', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		seedConfig();
		writeSnapshotFiles(schemaDir, grouped);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('does not include');
		expect(err).toContain('pages → website (group parent)');
	});

	function interceptServerInfo(version: string): void {
		agent
			.get(url)
			.intercept({ path: /^\/server\/info/, method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: { version } }, { headers: { 'content-type': 'application/json' } });
	}

	function versionedSnapshot(version: string): Snapshot {
		return {
			version: 1,
			directus: version,
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};
	}

	it('refuses ANY known version mismatch — patch included — naming both versions and the flag', async () => {
		// The server enforces an exact version match on /schema/diff (historically some patches are
		// breaking; core's call is to keep that). The CLI mirrors the gate instead of second-guessing it,
		// refusing client-side with both versions and the sanctioned bypass named — not the server's hint
		// about a query parameter a CLI user cannot pass. No diff intercept exists: reaching /schema/diff
		// would hit the disabled dispatcher, proving the refusal happens first.
		seedConfig();
		writeSnapshotFiles(schemaDir, versionedSnapshot('11.2.0'));
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptServerInfo('11.2.5');

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('Version mismatch');
		expect(err).toContain('11.2.0');
		expect(err).toContain('11.2.5');
		expect(err).toContain('--allow-version-drift');
	});

	it('--allow-version-drift sends force to /schema/diff and says so out loud', async () => {
		// The flag is the server's own sanctioned bypass (its force query parameter) made explicit. A
		// permissive intercept captures the raw query so the assertion rests on wire evidence rather than
		// the mock's query-matching semantics. The forced run must also leave the versions on record — a CI
		// log reader needs them when a cross-version diff produces a strange plan.
		seedConfig();
		writeSnapshotFiles(schemaDir, versionedSnapshot('11.2.0'));
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptServerInfo('11.2.5');

		let diffQuery: string | undefined;

		agent
			.get(url)
			.intercept({ path: (path: string) => path.startsWith('/schema/diff'), method: 'POST' })
			.reply(204, (opts) => {
				diffQuery = String(opts.path).split('?')[1];
				return '';
			});

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--allow-version-drift')).toBe(0);

		expect(diffQuery).toContain('force=true');
		expect(stderr.join('')).toContain('Version drift forced');
	});

	it('leaves an unparseable version to the server gate instead of refusing on a guess', async () => {
		// A fork tag or failed /server/info probe is not a KNOWN mismatch: the CLI must not block a push it
		// cannot prove wrong, and must not send force it was never asked for — the server's exact-match
		// check stays the authority. The raw query is captured to prove force is absent.
		seedConfig();
		writeSnapshotFiles(schemaDir, versionedSnapshot('11.2.0'));
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptServerInfo('a-custom-fork');

		let diffQuery: string | undefined;

		agent
			.get(url)
			.intercept({ path: (path: string) => path.startsWith('/schema/diff'), method: 'POST' })
			.reply(204, (opts) => {
				diffQuery = String(opts.path).split('?')[1];
				return '';
			});

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		expect(stderr.join('')).not.toContain('Version mismatch');
		expect(diffQuery).toBe('mode=merge');
	});

	it('emits applied:true with the counts and the verified hash on --json', async () => {
		// CI reads this exact shape to confirm the push landed and to record the hash it applied against.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());
		interceptApply();

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			project: 'default',
			mode: 'merge',
			applied: true,
			changes: true,
			schemaSkipped: false,
			added: 1,
			modified: 1,
			deleted: 0,
			hash: 'h1',
			data: { mode: 'merge', source: null, collections: null, incomplete: null, skipped: true },
		});
	});

	it('reports applied:false on a no-change diff and never calls apply', async () => {
		// A 204 diff is "nothing to push": the command must exit 0 with applied:false and issue no apply
		// request at all. No apply intercept is registered, so the disabled dispatcher would throw on one.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			project: 'default',
			mode: 'merge',
			applied: false,
			changes: false,
			schemaSkipped: false,
			added: 0,
			modified: 0,
			deleted: 0,
			hash: null,
			data: { mode: 'merge', source: null, collections: null, incomplete: null, skipped: true },
		});
	});

	it('refuses to apply without --yes in a non-interactive context', async () => {
		// No TTY and no --yes: the push cannot silently apply, so it fails pointing at --yes. No apply
		// intercept — reaching exit 1 proves nothing was applied.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());

		expect(await d6s('sync', 'push', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('--yes');
	});

	it('surfaces a re-run hint when the target hash changed between diff and apply', async () => {
		// The diff was generated moments earlier, so a hash mismatch on apply means a concurrent schema
		// change: the error must tell the operator to re-run the push, not just echo the raw payload error.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());
		mockApplyHashMismatch(agent);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);
		expect(stderr.join('')).toMatch(/re-run d6s sync push/i);
	});

	it('refuses a deletion-bearing MERGE diff in CI without --dangerously-allow-delete', async () => {
		// The backstop behind the mirror gate: a merge diff should never carry deletions, but if the
		// server returns one anyway it must not ride in under --yes — the deletion consent is
		// --dangerously-allow-delete, in every mode. No apply intercept: the refusal precedes any apply request.
		const deletionDiff = {
			collections: [],
			fields: [{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] }],
			systemFields: [],
			relations: [],
		};

		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', deletionDiff);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toMatch(/deletes/i);
		expect(err).toContain('--dangerously-allow-delete');
	});

	it('resolves mode from project config when no flag is given, and lets the flag win', async () => {
		// A committed config can select mirror — deletion behavior — so precedence must be pinned. Run 1:
		// no flag, projects.default.mode=mirror; the mode-bearing diff intercept only matches mode=mirror
		// on the wire, and the CI mirror gate must fire off the config-resolved mode. Run 2: an explicit
		// --mode merge overrides the config; the merge intercept matching (204) proves the flag won.
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url } }, projects: { default: { mode: 'mirror' } } }),
		);

		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', mergeDiffBody());

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);
		expect(stderr.join('')).toMatch(/refusing mirror/i);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'merge', '--yes')).toBe(0);
		expect(stderr.join('')).toContain('nothing to push.');
	});
});

describe('sync push with data', () => {
	// A distinct source URL (the instance the data was pulled from) so the ID map's source→target bucket
	// keys are visibly different — the exact keying push must reproduce from the committed metadata.
	const source = 'https://source.example.com';
	let schemaDir: string;
	let dataDir: string;
	let idMapPath: string;

	beforeEach(() => {
		schemaDir = join(dir, 'directus', 'default', 'schema');
		dataDir = join(dir, 'directus', 'default', 'data');
		idMapPath = join(dir, 'directus', 'default', 'id_map.json');
	});

	function schemaChangesBody(): Record<string, unknown> {
		return {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [],
			systemFields: [],
			relations: [],
		};
	}

	// Roles matched by natural key (name) and an access row referencing that role (FK remap): both remap
	// behaviors in one batch.
	function fullFixture(): DataCollection[] {
		return [
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor', icon: 'edit' }] },
			{
				collection: 'directus_access',
				primaryKey: 'id',
				records: [{ id: 'sa1', role: 'sr1', policy: null, user: null }],
			},
		];
	}

	function fullImportResult(): Record<string, unknown> {
		return {
			applied: true,
			mode: 'merge',
			collections: {
				directus_access: { existing: [], new: ['na1'], deleted: [], mapped: { sa1: 'na1' } },
				directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} },
			},
		};
	}

	function seedData(collections: DataCollection[]): void {
		writeDataFiles(dataDir, collections, source);
	}

	function readIdMapFile(): Record<string, unknown> {
		return JSON.parse(readFileSync(idMapPath, 'utf8'));
	}

	it('refuses a mirror push whose committed export is marked incomplete — no flag overrides it', async () => {
		// The pull-time manifest flag exists for exactly this moment: under mirror, absence from the batch
		// IS the deletion order, and an export the source truncated (unlicensed instances hide custom-rule
		// permissions from reads) is full of absences that are lies. Even the full deletion consent
		// (--dangerously-allow-delete) cannot authorize deletions no plan can name.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		writeDataFiles(
			dataDir,
			[
				{
					collection: 'directus_permissions',
					primaryKey: 'id',
					records: [{ id: 1, policy: 'p1', collection: 'articles', action: 'read' }],
				},
			],
			source,
			['directus_permissions'],
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('mirror', null);
		interceptTarget('/permissions', []);

		expect(
			await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--dangerously-allow-delete', '--yes'),
		).toBe(1);

		const output = stderr.join('');
		expect(output).toMatch(/refusing mirror/i);
		expect(output).toContain('directus_permissions');
		expect(output).toContain('re-pull');
	});

	it('pushes an incomplete export under merge — upserting visible rows touches nothing hidden', async () => {
		// The flag gates only deletion semantics. Merge sends what the export has and deletes nothing, so
		// a degraded (unlicensed) source can still sync everything it CAN read.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		writeDataFiles(
			dataDir,
			[
				{
					collection: 'directus_permissions',
					primaryKey: 'id',
					records: [{ id: 1, policy: 'p1', collection: 'articles', action: 'read' }],
				},
			],
			source,
			['directus_permissions'],
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', null);
		interceptTarget('/permissions', []);

		interceptImport(
			{ mode: 'merge' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: { directus_permissions: { existing: [], new: [1], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		// The report must carry the marker: a CI consumer of a merge push needs to know the export it just
		// applied was partial, without re-reading the manifest.
		const payload = JSON.parse(stdout.join(''));
		expect(payload.ok).toBe(true);
		expect(payload.data).toMatchObject({ incomplete: ['directus_permissions'], skipped: false });
	});

	it('uploads the remapped batch and writes the map from reconcile matches and the import response', async () => {
		// The safety core of a repeat import: the multipart body must decode to records rewritten into target
		// space — role sr1→tr1 (reconciled by name), access.role remapped to tr1, content untouched — in
		// system-then-content order; and the committed map must fold in the reconcile match, the server's
		// sa1→na1 remap, and the identity roles entry. All against one target URL keyed under the source URL.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData(fullFixture());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);
		interceptTarget('/access', []);

		let sentForm: FormData | undefined;

		interceptImport({ mode: 'merge' }, { data: fullImportResult() }, 200, (form) => {
			sentForm = form;
		});

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_access', items: [{ id: 'sa1', role: 'tr1', policy: null, user: null }] },
			{ collection: 'directus_roles', items: [{ id: 'tr1', name: 'Editor', icon: 'edit' }] },
		]);

		expect(readIdMapFile()).toEqual({
			formatVersion: 1,
			maps: {
				[source]: {
					[url]: {
						directus_access: { sa1: 'na1' },
						directus_roles: { sr1: 'tr1' },
					},
				},
			},
		});
	});

	it('sends a schema MERGE diff and a data ADD import under --mode add', async () => {
		// add maps to an additive schema diff (mode=merge on the wire) and an add-mode import (existing rows
		// untouched). The two query matchers assert both wire modes exactly.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
		// No target match: a matched role would be skipped under add (already on the target), and the
		// import this test exists to assert would never fire.
		interceptTarget('/roles', []);

		interceptImport(
			{ mode: 'add' },
			{
				data: {
					applied: true,
					mode: 'add',
					collections: { directus_roles: { existing: [], new: ['tr1'], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'add', '--yes')).toBe(0);
	});

	it('recreates a mapped record under add when its target row is gone, still skipping present ones', async () => {
		// add skips mapped rows to avoid duplicate inserts, but the skip must be conditional on the target
		// row existing: a mapped row deleted on the target would otherwise stay missing forever with no
		// signal (merge/mirror self-heal by sending the mapped PK). sr1→t9 is absent from the target, so
		// its record must ride the batch under the mapped PK; sr2→tr1 is present, so it stays skipped.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_roles',
				primaryKey: 'id',
				records: [
					{ id: 'sr1', name: 'Editor' },
					{ id: 'sr2', name: 'Admin' },
				],
			},
		]);

		writeFileSync(
			idMapPath,
			JSON.stringify({
				formatVersion: 1,
				maps: { [source]: { [url]: { directus_roles: { sr1: 't9', sr2: 'tr1' } } } },
			}),
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Admin' }]);

		let sentForm: FormData | undefined;

		interceptImport(
			{ mode: 'add' },
			{
				data: {
					applied: true,
					mode: 'add',
					collections: { directus_roles: { existing: [], new: ['t9'], deleted: [], mapped: {} } },
				},
			},
			200,
			(form) => {
				sentForm = form;
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'add', '--yes')).toBe(0);

		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_roles', items: [{ id: 't9', name: 'Editor' }] },
		]);
	});

	it('fetches unkeyed system targets under add so occupied panels are skipped, not duplicated', async () => {
		// Panels have no natural key, so they never enter reconciliation — but their target rows MUST still
		// be fetched: an unfetched collection reads as "all rows missing", the mapped-row self-heal resends
		// every mapped panel, and the server resolves each add-mode conflict by minting a fresh UUID. That
		// duplicated every mapped panel on every repeated add push. Here sp1 is mapped and present (skip),
		// sp2 is unmapped but its PK already exists on the target — shared seed ancestry — (skip), and only
		// the genuinely new sp3 may ride the batch.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_panels',
				primaryKey: 'id',
				records: [
					{ id: 'sp1', name: 'Orders' },
					{ id: 'sp2', name: 'Signups' },
					{ id: 'sp3', name: 'Revenue' },
				],
			},
		]);

		writeFileSync(
			idMapPath,
			JSON.stringify({
				formatVersion: 1,
				maps: { [source]: { [url]: { directus_panels: { sp1: 'tp1' } } } },
			}),
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/panels', [
			{ id: 'tp1', name: 'Orders' },
			{ id: 'sp2', name: 'Signups' },
		]);

		let sentForm: FormData | undefined;

		interceptImport(
			{ mode: 'add' },
			{
				data: {
					applied: true,
					mode: 'add',
					collections: { directus_panels: { existing: [], new: ['sp3'], deleted: [], mapped: {} } },
				},
			},
			200,
			(form) => {
				sentForm = form;
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'add', '--yes')).toBe(0);

		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_panels', items: [{ id: 'sp3', name: 'Revenue' }] },
		]);
	});

	it('refuses committed content data files loudly, naming the collection, before any target read or import', async () => {
		// Content sync is deferred from this release: pull no longer writes content data files, so any that
		// remain are stale committed artifacts whose rows push can no longer import safely (a raw integer
		// content PK can overwrite an unrelated target row). The refusal must precede all data-phase network
		// work — only the schema diff is intercepted, so a reached target read or import would throw on the
		// disabled dispatcher and change this failure's shape.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('content collections: articles');
		expect(err).toMatch(/deferred/i);
		expect(err).toMatch(/delete those data files/i);
	});

	it('carries dangerouslyAllowDelete on the import when mirror runs with --dangerously-allow-delete', async () => {
		// mirror maps to a merge import plus dangerouslyAllowDelete (the server has no wire "mirror"); the
		// exact query match proves the destructive flag rode along only because --dangerously-allow-delete consented.
		// The schema diff carries a DELETION, so this also pins the schema half of the consent: with
		// --dangerously-allow-delete the sealed { hash, diff } reaches apply byte-for-byte, deletions included.
		const deletionDiff = {
			collections: [],
			fields: [{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] }],
			systemFields: [],
			relations: [],
		};

		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', deletionDiff);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

		let applied: unknown;

		interceptApply((body) => {
			applied = body;
		});

		interceptImport(
			{ mode: 'merge', dangerouslyAllowDelete: 'true' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: { directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} } },
				},
			},
		);

		expect(
			await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes', '--dangerously-allow-delete'),
		).toBe(0);

		expect(applied).toEqual({ hash: 'h1', diff: deletionDiff });
	});

	it('refuses mirror in CI without --dangerously-allow-delete before any apply or import, even with data present', async () => {
		// Mirror can delete schema and data rows absent from the import set, unknowable in
		// CI without a dry-run, so it is refused outright. Only the diff and the reconcile target read are registered — a reached apply or
		// import would throw on the disabled dispatcher, proving neither happened.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', schemaChangesBody());
		interceptTarget('/flows', []);

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toMatch(/refusing mirror/i);
		expect(err).toContain('--dangerously-allow-delete');
	});

	it('refuses an ambiguous reconcile in CI, naming the collision, before any import', async () => {
		// Reconcile never guesses and CI cannot prompt: two target roles named Editor make sr1 ambiguous,
		// so push must fail STATE naming the collision and routing to an interactive run. Only the diff
		// and the target fetch are registered — a reached apply or import would throw on the disabled
		// dispatcher, proving the refusal preceded any mutation.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/roles', [
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('Ambiguous target matches');
		expect(err).toContain('directus_roles source "Editor" — sr1');
		expect(err).toMatch(/interactively/i);
	});

	it('renders the cycle when the import fails with IMPORT_CYCLICAL_RELATION', async () => {
		// A cyclical failure must name the collections and non-nullable relations forming the cycle and point
		// at the fix (make one nullable). Schema is clean here, so the import is the only failure and its
		// enriched error surfaces directly rather than under a partial-failure wrap.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		// No target match: an identical matched role would be dropped as unchanged and the failing import
		// this test asserts would never fire.
		interceptTarget('/roles', []);

		interceptImport(
			{ mode: 'merge' },
			{
				errors: [
					{
						message: "Can't import collections",
						extensions: {
							code: 'IMPORT_CYCLICAL_RELATION',
							collections: ['directus_flows', 'directus_operations'],
							relations: [{ collection: 'directus_flows', field: 'operation', related: 'directus_operations' }],
						},
					},
				],
			},
			422,
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('directus_flows');
		expect(err).toContain('directus_operations');
		expect(err).toMatch(/nullable/i);
	});

	it('reports a converged data push as nothing-to-push without calling import', async () => {
		// When every committed record's exported non-PK fields match the target, the batch empties and push
		// must stop instead of upserting every row again (the server
		// reports any PK-present row as "existing" whether or not it changed, so only this client-side
		// comparison can close the loop). No import intercept is registered: a reached import would throw.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);
		expect(stderr.join('')).toContain('schema and data match; nothing to push.');
	});

	it('reports schema-applied and a data-retry path when the import fails after a schema apply', async () => {
		// Partial failure: the schema landed but the import threw. There is no rollback, so the operator must
		// be told the schema is already applied and that a re-run retries only the data (empty schema diff).
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
		// No target match: an identical matched role would be dropped as unchanged and the failing import
		// this test asserts would never fire.
		interceptTarget('/roles', []);

		interceptImport(
			{ mode: 'merge' },
			{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
			500,
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toMatch(/schema/i);
		expect(err).toMatch(/re-run|retry/i);
	});

	it('keeps the diff-first guidance when the import outcome is unknown after a schema apply', async () => {
		// A dropped connection does NOT stop the server's import transaction — it may still commit, with the
		// id-map updates in the lost response. The one safety instruction for that scenario is "run diff
		// before retrying"; the schema-applied wrapper must not replace it with generic re-run advice, which
		// is exactly the blind retry that duplicates records.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
		interceptTarget('/roles', []);

		agent
			.get(url)
			.intercept({ path: (path: string) => path.startsWith('/utils/import'), method: 'POST' })
			.replyWithError(new Error('socket hang up'));

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('Schema was applied');
		expect(err).toContain('diff before retrying');
		expect(err).not.toContain('re-run d6s sync push');
	});

	it('pushes data only for a "schema": false project — no snapshot needed, no schema wire calls', async () => {
		// A resource-only ops project must carry NO schema authority. Before the key existed, such a project
		// silently committed a FULL snapshot, handing a mirror push delete authority over every collection.
		// No schema files are seeded and no /schema/* intercept exists — reaching either fails the test.
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url } }, projects: { default: { schema: false } } }),
		);

		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptTarget('/roles', []);

		interceptImport(
			{ mode: 'merge' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: { directus_roles: { existing: [], new: ['sr1'], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);
		expect(stderr.join('')).toContain('Schema — skipped');

		// The final sentence must not read "Schema already matches" — nothing was compared. QA hit
		// exactly this: every earlier line said skipped, then the summary claimed a match.
		expect(stderr.join('')).toContain('Schema phase skipped');
		expect(stderr.join('')).not.toContain('already matches');
	});

	it('reports applied:true on --json for a data-only push — the target DID change', async () => {
		// `applied` answered only the schema phase, so a push that imported records while the schemas
		// already matched reported applied:false — a CI consumer reading that as "nothing happened"
		// archives a lie about a target it just mutated.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', []);

		interceptImport(
			{ mode: 'merge' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: { directus_roles: { existing: [], new: ['sr1'], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));
		expect(payload.applied).toBe(true);
		expect(payload.changes).toBe(true);
		expect(payload.schemaSkipped).toBe(false);
	});

	it('refuses a project config pairing "schema": false with a collections scope', async () => {
		// The pair is a contradiction — a schema scope on a project that pulls no schema — and guessing
		// which key wins would either resurrect the full-snapshot footgun or silently drop the scope.
		// Config parse names the mistake before any command half-runs.
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({
				profiles: { staging: { url } },
				projects: { default: { schema: false, collections: ['articles'] } },
			}),
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);
		expect(stderr.join('')).toContain('cannot be combined');
	});

	it('warns when committed schema files exist under "schema": false instead of silently ignoring them', async () => {
		// Schema files beside a schema:false config usually mean the config changed after a pull; silence
		// would leave the operator believing those files still push. Zero intercepts: with no data files and
		// no schema phase, the whole command must complete without a single request.
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url } }, projects: { default: { schema: false } } }),
		);

		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('schema phase is skipped');
		expect(err).toContain('nothing to push');
	});

	it('emits the PushReport data block with the source and parsed response collections on --json', async () => {
		// CI reads this shape: the data block is always present, carrying the mode, the source URL, and the
		// server's per-collection response as parsed at the boundary (unknown fields are stripped by the
		// strict contract schema — this is NOT a verbatim passthrough), alongside the project and schema
		// fields.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData(fullFixture());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);
		interceptTarget('/access', []);
		interceptImport({ mode: 'merge' }, { data: fullImportResult() });

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));

		expect(payload).toMatchObject({
			kind: 'PushReport',
			ok: true,
			project: 'default',
			mode: 'merge',
			applied: true,
			data: {
				mode: 'merge',
				source,
				skipped: false,
				incomplete: [],
				collections: fullImportResult()['collections'],
			},
		});
	});

	it('reports changes:true for a data-only push that imported rows', async () => {
		// A push with a clean schema but a real import mutated the target: both `changes` and `applied`
		// answer for the whole push (schema OR data). An `applied: false` here made a CI consumer archive
		// "nothing happened" about a target the push just mutated.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', []);

		interceptImport(
			{ mode: 'merge' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: { directus_roles: { existing: [], new: ['sr1'], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));

		expect(payload).toMatchObject({ kind: 'PushReport', ok: true, applied: true, changes: true, hash: null });
	});

	it('writes a byte-identical id map across two identical push runs', async () => {
		// Determinism through the whole path: a second push against the same source must reproduce the exact
		// committed map (reconcile skips settled records, the response folds back to the same entries), so a
		// no-op push is a no-op diff in the repo.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData(fullFixture());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		function register(): void {
			interceptDiff('merge', schemaChangesBody());
			interceptApply();
			interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);
			interceptTarget('/access', []);
			interceptImport({ mode: 'merge' }, { data: fullImportResult() });
		}

		register();
		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);
		const first = readFileSync(idMapPath, 'utf8');

		register();
		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);
		const second = readFileSync(idMapPath, 'utf8');

		expect(second).toBe(first);
	});
});
