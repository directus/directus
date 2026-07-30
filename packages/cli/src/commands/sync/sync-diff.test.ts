import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snapshot } from '../../sync/contract.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import {
	decodeBatch,
	fullSnapshot,
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

function interceptImport(
	query: Record<string, string>,
	result: Record<string, unknown>,
	status = 200,
	capture?: (form: FormData) => void,
): void {
	mockImport(agent, query, result, status, capture);
}

describe('sync diff', () => {
	let schemaDir: string;

	beforeEach(() => {
		schemaDir = join(dir, 'directus', 'default', 'schema');
	});

	function partialSnapshot(): Snapshot {
		return { ...fullSnapshot(), version: 2 };
	}

	function diffBody(): Record<string, unknown> {
		return {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [
				{
					collection: 'articles',
					field: 'title',
					diff: [{ kind: 'E', path: ['meta', 'note'], lhs: null, rhs: 'headline' }],
				},
				{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] },
			],
			systemFields: [],
			relations: [],
		};
	}

	it('sends the seeded snapshot to /schema/diff byte-for-byte and renders the change summary', async () => {
		// The whole git workflow rests on the diff computing against exactly what pull wrote, so the
		// request body must deep-equal the seeded snapshot — the file→wire round trip, unmodified.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		let sent: unknown;

		interceptDiff('merge', diffBody(), (body) => {
			sent = body;
		});

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		expect(sent).toEqual(fullSnapshot());

		const out = stdout.join('');
		expect(out).toContain('✖ DELETE');
		expect(out).toContain('(meta.note)');
	});

	it('emits a machine payload of changes:true with the counts and diff hash on --json', async () => {
		// CI reads this shape to decide there is something to push and to persist the hash apply seals against.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', diffBody());

		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			project: 'default',
			mode: 'merge',
			changes: true,
			added: 1,
			modified: 1,
			deleted: 1,
			hash: 'h1',
			// No data dir was seeded, so the preview is skipped and its block carries null-ish fields —
			// always present so a consumer never has to guess whether data was previewed.
			data: {
				mode: 'merge',
				source: null,
				collections: null,
				matched: null,
				ambiguous: null,
				unmatched: null,
				unchanged: null,
				incomplete: null,
				skipped: true,
			},
		});
	});

	it('reports no changes on a 204 and keys the machine shape off changes:false, hash:null', async () => {
		// CI keys off this exact "nothing to push" shape, so the counts collapse to zero and hash is null.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);
		expect(stderr.join('')).toContain('staging matches the local snapshot — nothing to do.');

		interceptDiff('merge', null);
		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			project: 'default',
			mode: 'merge',
			changes: false,
			added: 0,
			modified: 0,
			deleted: 0,
			hash: null,
			data: {
				mode: 'merge',
				source: null,
				collections: null,
				matched: null,
				ambiguous: null,
				unmatched: null,
				unchanged: null,
				incomplete: null,
				skipped: true,
			},
		});
	});

	it('diffs a partial snapshot in mirror mode by sending it to the wire', async () => {
		// A partial mirror may delete fields/relations within scope, but never omitted collections.
		seedConfig();
		writeSnapshotFiles(schemaDir, partialSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', null);

		expect(await d6s('sync', 'diff', '--to', 'staging', '--mode', 'mirror')).toBe(0);
		expect(stderr.join('')).toContain('staging matches the local snapshot — nothing to do.');
	});

	it('refuses a diff whose collection entry starts with a nested-meta delete (directus#27877)', async () => {
		// The server's apply drops the WHOLE collection when the first diff op is kind D — even a nested
		// meta delete produced by migration skew — while this CLI classifies a pathed D as a modification,
		// so the plan would show a harmless tweak and the deletion gate would never arm. The only safe
		// answer is refusal before anything displays or applies, in diff and push alike (shared localDiff).
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', {
			collections: [{ collection: 'articles', diff: [{ kind: 'D', path: ['meta', 'status'], lhs: 'draft' }] }],
			fields: [],
			systemFields: [],
			relations: [],
		});

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('DROP 1 collection (articles)');
		expect(err).toContain('27877');
		expect(err).toContain('migration skew');
	});

	it('passes a genuine root-delete collection through to the loud plan line', async () => {
		// The guard keys on the op SHAPE (pathed D), never on D itself: an intentional collection delete is
		// a root D and must keep flowing to the DELETE line and the deletion gates downstream.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', {
			collections: [{ collection: 'legacy', diff: [{ kind: 'D', lhs: { collection: 'legacy' } }] }],
			fields: [],
			systemFields: [],
			relations: [],
		});

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);
		expect(stdout.join('')).toContain('✖ DELETE  collection legacy');
	});

	it('fails with the pull-first precondition when no snapshot has been pulled', async () => {
		// The operator must be routed to the fix: config and credential resolve, but with no artifacts on
		// disk the STATE error points at `d6s sync pull` rather than failing obscurely downstream.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Run d6s sync pull first.');
	});
});

// Data diff is read-only: reconciliation applies unambiguous matches in memory and never writes the ID map.
describe('sync diff with data', () => {
	const source = 'https://source.example.com';
	let schemaDir: string;
	let dataDir: string;
	let idMapPath: string;

	beforeEach(() => {
		schemaDir = join(dir, 'directus', 'default', 'schema');
		dataDir = join(dir, 'directus', 'default', 'data');
		idMapPath = join(dir, 'directus', 'default', 'id_map.json');
	});

	function seedData(collections: DataCollection[]): void {
		writeDataFiles(dataDir, collections, source);
	}

	it('dry-runs the remapped batch, renders per-collection data lines, and writes nothing', async () => {
		// Apply the unambiguous role match in memory without persisting it; the unmatched flow rides verbatim.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor', icon: 'edit' }] },
			{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] },
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);
		interceptTarget('/flows', []);

		let sentForm: FormData | undefined;

		interceptImport(
			{ mode: 'merge', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: {
						directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} },
						directus_flows: { existing: [], new: ['f1'], deleted: [], mapped: {} },
					},
				},
			},
			200,
			(form) => {
				sentForm = form;
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		// The dry-run receives the unambiguous role remap in target space, in graph import order.
		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_flows', items: [{ id: 'f1', name: 'Deploy' }] },
			{ collection: 'directus_roles', items: [{ id: 'tr1', name: 'Editor', icon: 'edit' }] },
		]);

		const out = stdout.join('');
		expect(out).toContain('directus_flows');
		expect(out).toContain('+1 new');
		expect(out).toContain('directus_roles');

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports the reconcile counts and the parsed dry-run response on --json, still writing nothing', async () => {
		// CI reads the data block: the mode, the source URL, the server's per-collection dry-run response
		// as parsed at the boundary (unknown fields are stripped — not a verbatim passthrough), and the
		// reconcile tally (the role matched, the flow still pending). The id map stays absent.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] },
			{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] },
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const collections = {
			directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} },
			directus_flows: { existing: [], new: ['f1'], deleted: [], mapped: {} },
		};

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);
		interceptTarget('/flows', []);
		interceptImport({ mode: 'merge', dryRun: 'true' }, { data: { applied: false, mode: 'merge', collections } });

		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));

		expect(payload).toMatchObject({
			kind: 'DiffReport',
			project: 'default',
			mode: 'merge',
			changes: true,
			data: {
				mode: 'merge',
				source,
				collections,
				matched: 1,
				ambiguous: 0,
				unmatched: 1,
				skipped: false,
			},
		});

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports an ambiguous record as unresolved, never as a create, and never prompts or writes', async () => {
		// Two target roles named Editor make sr1 ambiguous. An operator gates a CI mirror push on these
		// numbers, and sr1 is NOT a create: an interactive push may resolve it into an UPDATE, and a
		// non-interactive push REFUSES until it is resolved — counting it as created would lie in both
		// directions. So sr1 must be excluded from the dry-run batch, surface in its own "unresolved"
		// segment, and the note must state the non-interactive refusal. diff still never prompts or writes.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_roles',
				primaryKey: 'id',
				records: [
					{ id: 'sr1', name: 'Editor' },
					{ id: 'sr2', name: 'Writer' },
				],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/roles', [
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		let sentForm: FormData | undefined;

		interceptImport(
			{ mode: 'merge', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: { directus_roles: { existing: [], new: ['sr2'], deleted: [], mapped: {} } },
				},
			},
			200,
			(form) => {
				sentForm = form;
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		// The ambiguous source never reaches the dry-run, so the server cannot report it as a create.
		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_roles', items: [{ id: 'sr2', name: 'Writer' }] },
		]);

		const err = stderr.join('');
		expect(err).toContain('1 created, 0 updated, 0 deleted, 1 unresolved');
		expect(err).toContain('2 committed records have no target match yet');
		expect(err).toContain('1 ambiguous');
		expect(err).toContain('a non-interactive push refuses until they are resolved');

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('shows data deletes under mirror without applying or writing anything', async () => {
		// A mirror preview dry-runs with dangerouslyAllowDelete, so the plan can show a target row absent from
		// the import set as a delete. diff never applies (dry-run rolls back) and never writes the map.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', null);

		interceptTarget('/roles', [
			{ id: 'tr1', name: 'Editor' },
			{ id: 'tr9', name: 'Stale' },
		]);

		interceptImport(
			{ mode: 'merge', dangerouslyAllowDelete: 'true', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: { directus_roles: { existing: ['tr1'], new: [], deleted: ['tr9'], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging', '--mode', 'mirror')).toBe(0);

		const out = stdout.join('');
		expect(out).toContain('✖');
		expect(out).toContain('tr9');

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('extends the no-op copy when the data was checked and also matches', async () => {
		// Schema clean AND an all-zero data dry-run is "nothing to do", but the line must say the data was
		// checked too — distinguishing it from a schema-only checkout where data is skipped.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

		interceptImport(
			{ mode: 'merge', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: { directus_roles: { existing: [], new: [], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);
		expect(stderr.join('')).toContain('schema and data match; nothing to do.');
		expect(existsSync(idMapPath)).toBe(false);
	});
});
