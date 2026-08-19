import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	decodeBatch,
	fullSnapshot,
	mockAdminGlobals,
	mockDiff,
	mockImport,
	mockList,
	runSync,
	seedProjectConfig,
	SYNC_TOKEN,
	SYNC_URL,
	useSyncWorld,
} from './sync.test-support.js';
import type { Snapshot } from './utils/contract.js';
import { type DataCollection, writeDataFiles } from './utils/data-store.js';
import { writeSnapshotFiles } from './utils/store.js';

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
	capture?: (form: FormData) => void,
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
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		let sent: FormData | undefined;

		interceptDiff('merge', diffBody(), (form) => {
			sent = form;
		});

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		expect(await decodeBatch(sent)).toEqual(fullSnapshot());

		const out = stdout.join('');
		expect(out).toContain('✖ DELETE');
		expect(out).toContain('(meta.note)');
	});

	it('refuses a target below the Environment Sync floor, naming both versions', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		agent
			.get(url)
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { version: '12.1.0' } }, { headers: { 'content-type': 'application/json' } });

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Environment Sync needs Directus 12.2.0 or later; "staging" runs 12.1.0.');
	});

	// Same preflight as pull, reached through planSchema — diff and push share the gate.
	it('refuses a non-admin token with the same message as pull', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		mockAdminGlobals(agent, false);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Environment Sync needs an admin token; "staging" resolves to a non-admin user.');
	});

	it('honors the version gate and --allow-drift like push — diff must not preview what push refuses', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		agent
			.get(url)
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { version: '12.2.1' } }, { headers: { 'content-type': 'application/json' } })
			.times(2);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Version mismatch');

		agent
			.get(url)
			.intercept({ path: '/schema/diff', method: 'POST', query: { mode: 'merge', force: 'true' } })
			.reply(204, '');

		expect(await d6s('sync', 'diff', '--to', 'staging', '--allow-drift')).toBe(0);
		expect(stderr.join('')).toContain('Compatibility check bypassed');
	});

	it('emits a machine payload of changes:true with the counts and diff hash on --json', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', diffBody());

		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			target: url,
			profile: 'staging',
			project: 'default',
			mode: 'merge',
			changes: true,
			schemaSkipped: false,
			added: 1,
			modified: 1,
			deleted: 1,
			hash: 'h1',
			data: null,
		});
	});

	it('reports no changes on a 204 and keys the machine shape off changes:false, hash:null', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);
		expect(stderr.join('')).toContain(`${url} matches ./directus/default — nothing to do.`);

		interceptDiff('merge', null);
		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			target: url,
			profile: 'staging',
			project: 'default',
			mode: 'merge',
			changes: false,
			schemaSkipped: false,
			added: 0,
			modified: 0,
			deleted: 0,
			hash: null,
			data: null,
		});
	});

	it('diffs a partial snapshot in mirror mode, keeping its partial tag on the wire', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, partialSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		let sent: FormData | undefined;

		interceptDiff('mirror', null, (form) => {
			sent = form;
		});

		expect(await d6s('sync', 'diff', '--to', 'staging', '--mode', 'mirror')).toBe(0);

		// Downgrading the tag to a full snapshot would let mirror read the omitted collections as deletions.
		expect(await decodeBatch(sent)).toEqual(partialSnapshot());
		expect(stderr.join('')).toContain(`${url} matches ./directus/default — nothing to do.`);
	});

	it('refuses a diff whose collection entry starts with a nested-meta delete (directus#27877)', async () => {
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
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Run d6s sync pull first.');
	});
});

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

	it('warns when the dry run matches a temporary key to a hidden target record, and still applies nothing', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [{ id: 4, policy: null, collection: 'articles', action: 'delete' }],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		// An empty list read makes the allocator pick -1; the dry run then reports that key as existing —
		// a row the target hides from lists but the import still matches by key.
		interceptTarget('/permissions', []);

		interceptImport(
			{ mode: 'merge', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: { directus_permissions: { existing: [-1], new: [], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		const warned = stderr.join('');

		// The same line push refuses with, source id included, so the preview names what push stops on.
		expect(warned).toContain('directus_permissions: source 4 — temporary key -1 is already a target record');
		expect(warned).toContain('Push will refuse');
		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports the reconcile counts and the parsed dry-run response on --json, still writing nothing', async () => {
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
			project: 'default',
			mode: 'merge',
			changes: true,
			data: {
				mode: 'merge',
				source,
				resultsByCollection: collections,
				reconciliation: { matched: 1, unmatched: 1, ambiguous: 0, dependent: 0 },
				unchanged: 1,
			},
		});

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports ambiguous and unmatched records as distinct states without prompting or writing', async () => {
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

		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_roles', items: [{ id: 'sr2', name: 'Writer' }] },
		]);

		const err = stderr.join('');
		expect(err).toContain('1 created, 0 updated, 0 deleted');
		expect(err).toContain('1 configuration record has an ambiguous target match.');
		expect(err).toContain('1 configuration record has no target match — push would create it.');
		expect(err).toContain('Run d6s sync push interactively to choose.');
		expect(err).not.toContain('unresolved');

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports direct ambiguity and dependent records separately on --json', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] },
			{
				collection: 'directus_access',
				primaryKey: 'id',
				records: [{ id: 'sa1', role: 'sr1', user: null, policy: null }],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/roles', [
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		interceptTarget('/access', []);

		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		const report = JSON.parse(stdout.join(''));
		expect(report.changes).toBe(true);
		expect(report).not.toHaveProperty('unresolved');
		expect(report.data.reconciliation).toEqual({ matched: 0, unmatched: 0, ambiguous: 1, dependent: 1 });
		expect(report.data.unchanged).toBe(0);
	});

	it('skips the schema phase for a "schema": false project and says so — never "schemas match"', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url } }, projects: { default: { schema: false } } }),
		);

		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('configuration matches; nothing to do (schema phase skipped)');
		expect(err).not.toContain('schema and configuration match');

		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		const report = JSON.parse(stdout.join(''));
		expect(report.schemaSkipped).toBe(true);
		expect(report.changes).toBe(false);
		expect(report.hash).toBeNull();
	});

	it('shows data deletes under mirror without applying or writing anything', async () => {
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
		expect(stderr.join('')).toContain('schema and configuration match; nothing to do.');
		expect(existsSync(idMapPath)).toBe(false);
	});
});
