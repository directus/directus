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
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());
		interceptApply();

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		const err = stderr.join('');

		const resolutionAt = err.indexOf(
			`Pushing to staging — ${url} (merge — creates and updates records, never deletes)`,
		);

		const summaryAt = err.indexOf('Schema — ');
		expect(resolutionAt).toBeGreaterThanOrEqual(0);
		expect(summaryAt).toBeGreaterThan(resolutionAt);
	});

	it('warns before apply when the committed schema references a collection it does not include', async () => {
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
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());

		expect(await d6s('sync', 'push', '--to', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('--yes');
	});

	it('surfaces a re-run hint when the target hash changed between diff and apply', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());
		mockApplyHashMismatch(agent);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);
		expect(stderr.join('')).toMatch(/re-run d6s sync push/i);
	});

	it('refuses a deletion-bearing MERGE diff in CI without --dangerously-allow-delete', async () => {
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

		const payload = JSON.parse(stdout.join(''));
		expect(payload.ok).toBe(true);
		expect(payload.data).toMatchObject({ incomplete: ['directus_permissions'], skipped: false });
	});

	it('uploads the remapped batch and writes the map from reconcile matches and the import response', async () => {
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
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
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
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
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
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', schemaChangesBody());
		interceptApply();
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

		expect(stderr.join('')).toContain('Schema phase skipped');
		expect(stderr.join('')).not.toContain('already matches');
	});

	it('reports applied:true on --json for a data-only push — the target DID change', async () => {
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
