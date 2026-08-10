import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

	it('prints the resolved target before applying the sealed diff byte-for-byte', async () => {
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

		const err = stderr.join('');

		const resolutionAt = err.indexOf(
			`Pushing ./directus/default to staging — ${url} (merge — creates and updates records, never deletes)`,
		);

		const summaryAt = err.indexOf('Schema — ');
		expect(resolutionAt).toBeGreaterThanOrEqual(0);
		expect(summaryAt).toBeGreaterThan(resolutionAt);
	});

	it('warns before apply when the local schema references a collection it does not include', async () => {
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
		expect(err).toContain('--allow-drift');
	});

	it('--allow-drift sends force to /schema/diff and says so out loud', async () => {
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

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--allow-drift')).toBe(0);

		expect(diffQuery).toContain('force=true');
		expect(stderr.join('')).toContain('Compatibility check bypassed');
	});

	// The vendor gate is the half the CLI cannot see, so the flag has to clear it on a version the CLI CAN see
	// matching — the version-conditioned bypass this replaced left cross-vendor pushes with no way through.
	it('--allow-drift sends force even when the versions match, so the vendor gate is reachable', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, versionedSnapshot('11.2.0'));
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptServerInfo('11.2.0');

		let diffQuery: string | undefined;

		agent
			.get(url)
			.intercept({ path: (path: string) => path.startsWith('/schema/diff'), method: 'POST' })
			.reply(204, (opts) => {
				diffQuery = String(opts.path).split('?')[1];
				return '';
			});

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--allow-drift')).toBe(0);

		expect(diffQuery).toContain('force=true');
		expect(stderr.join('')).toContain('Compatibility check bypassed');
	});

	it('names the flag when the target refuses the snapshot over its vendor', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, versionedSnapshot('11.2.0'));
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptServerInfo('11.2.0');

		agent
			.get(url)
			.intercept({ path: (path: string) => path.startsWith('/schema/diff'), method: 'POST' })
			.reply(
				400,
				{
					errors: [
						{
							message: `Provided snapshot's vendor postgres does not match the current instance's vendor sqlite. You can bypass this check by passing the "force" query parameter`,
							extensions: { code: 'INVALID_PAYLOAD' },
						},
					],
				},
				{ headers: { 'content-type': 'application/json' } },
			);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('refused the snapshot as incompatible');
		expect(err).toContain('--allow-drift');
		expect(err).toContain('vendor sqlite');
	});

	it('leaves a payload error force cannot clear without the flag hint', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, versionedSnapshot('11.2.0'));
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptServerInfo('11.2.0');

		agent
			.get(url)
			.intercept({ path: (path: string) => path.startsWith('/schema/diff'), method: 'POST' })
			.reply(
				400,
				{
					errors: [
						{
							message: `"fields[0].type" must be one of [string, text, boolean]`,
							extensions: { code: 'INVALID_PAYLOAD' },
						},
					],
				},
				{ headers: { 'content-type': 'application/json' } },
			);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('must be one of');
		expect(err).not.toContain('--allow-drift');
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
			data: null,
		});
	});

	it('reports applied:false on a no-change diff and never calls apply', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
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
			data: null,
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

	it('resolves mode from project configuration when no flag is given, and lets the flag win', async () => {
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

	it('refuses a mirror push whose local configuration is marked incomplete — no flag overrides it', async () => {
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

	it('pushes an incomplete pull under merge — upserting visible records touches nothing hidden', async () => {
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
					collections: { directus_permissions: { existing: [], new: [1], deleted: [], mapped: { '-1': 1 } } },
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));
		expect(payload.applied).toBe(true);
		expect(payload.data).toMatchObject({ incomplete: ['directus_permissions'] });
	});

	it('persists created numeric mappings so identical records do not become ambiguous later', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [
					{ id: 4, policy: null, collection: 'articles', action: 'read' },
					{ id: 5, policy: null, collection: 'articles', action: 'read' },
				],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', null);

		interceptTarget('/permissions', [
			{ id: 4, policy: null, collection: 'posts', action: 'read' },
			{ id: 5, policy: null, collection: 'comments', action: 'read' },
		]);

		let sentForm: FormData | undefined;

		interceptImport(
			{ mode: 'merge' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: {
						directus_permissions: {
							existing: [],
							new: [27, 28],
							deleted: [],
							mapped: { '-1': 27, '-2': 28 },
						},
					},
				},
			},
			200,
			(form) => {
				sentForm = form;
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		expect(await decodeBatch(sentForm)).toEqual([
			{
				collection: 'directus_permissions',
				items: [
					{ id: -1, policy: null, collection: 'articles', action: 'read' },
					{ id: -2, policy: null, collection: 'articles', action: 'read' },
				],
			},
		]);

		expect(readIdMapFile()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_permissions: { '4': '27', '5': '28' } } } },
		});

		interceptDiff('merge', null);

		interceptTarget('/permissions', [
			{ id: 4, policy: null, collection: 'posts', action: 'read' },
			{ id: 5, policy: null, collection: 'comments', action: 'read' },
			{ id: 27, policy: null, collection: 'articles', action: 'read' },
			{ id: 28, policy: null, collection: 'articles', action: 'read' },
		]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);
	});

	it('refuses to persist a temporary key the import response left unmapped — a wrong entry breeds duplicates', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [
					{ id: 4, policy: null, collection: 'articles', action: 'read' },
					{ id: 5, policy: null, collection: 'articles', action: 'read' },
				],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', null);
		interceptTarget('/permissions', []);

		// A contract-skewed server: both records were created, but only one temporary key came back mapped.
		interceptImport(
			{ mode: 'merge' },
			{
				data: {
					applied: true,
					mode: 'merge',
					collections: {
						directus_permissions: { existing: [], new: [27, 28], deleted: [], mapped: { '-1': 27 } },
					},
				},
			},
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		// The resolved mapping is still recorded; the unmapped temporary key is refused, not written as "-2".
		expect(readIdMapFile()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_permissions: { '4': '27' } } } },
		});

		const output = stderr.join('') + stdout.join('');
		expect(output).toContain('temporary key');
		expect(output).toContain('-2');
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

	it('recreates a mapped record under add when its target record is gone, still skipping present ones', async () => {
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

	it('refuses content files loudly, naming the collection, before any target read or import', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('content collections: articles');
		expect(err).toMatch(/deferred/i);
		expect(err).toMatch(/delete those files/i);
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
		expect(err).toContain('Push refused: 1 target match needs a choice.');
		expect(err).toContain('./directus/default contains 1 role named "Editor".');
		expect(err).toContain(`staging — ${url} contains 2 matching roles.`);
		expect(err).toMatch(/interactively/i);
	});

	it('pluralizes the ambiguity refusal', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_roles',
				primaryKey: 'id',
				records: [
					{ id: 'sr1', name: 'Editor' },
					{ id: 'sr2', name: 'Viewer' },
				],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/roles', [
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
			{ id: 't3', name: 'Viewer' },
			{ id: 't4', name: 'Viewer' },
		]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);
		expect(stderr.join('')).toContain('Push refused: 2 target matches need a choice.');
	});

	// A CI operator cannot see the interactive prompt, so the refusal is their only account of how much the
	// push is holding back. Counting the ambiguity alone understates it by every record waiting on that choice.
	it('names the dependent records a refused ambiguity holds back, not just the ambiguity', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_folders',
				primaryKey: 'id',
				records: [
					{ id: 'f-amb', name: 'Assets', parent: null },
					{ id: 'f-child', name: 'Images', parent: 'f-amb' },
					{ id: 'f-grand', name: 'Icons', parent: 'f-child' },
				],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/folders', [
			{ id: 't1', name: 'Assets', parent: null },
			{ id: 't2', name: 'Assets', parent: null },
		]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('Push refused: 1 target match needs a choice; 2 records depend on that choice.');
	});

	// Resources needing several fields to identify a record are the ones with no human-readable name, so a
	// composite key must name every field it matched on: "with this identity" would leave nothing to search for.
	it('names every field of a composite natural key when the collided records have no name', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', null);

		interceptTarget('/permissions', [
			{ id: 4, policy: null, collection: 'articles', action: 'read' },
			{ id: 5, policy: null, collection: 'articles', action: 'read' },
		]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('./directus/default contains 1 permission with collection "articles", action "read".');
		expect(err).not.toContain('with this identity');
	});

	it('reports the actual local and target counts when two local policies match one target policy', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{
				collection: 'directus_policies',
				primaryKey: 'id',
				records: [
					{ id: 'sp1', name: 'Administrator' },
					{ id: 'sp2', name: 'Administrator' },
				],
			},
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDiff('merge', null);
		interceptTarget('/policies', [{ id: 'tp1', name: 'Administrator' }]);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('./directus/default contains 2 policies named "Administrator".');
		expect(err).toContain(`staging — ${url} contains 1 matching policy.`);
		expect(err).not.toContain('source "Administrator"');
		expect(err).not.toContain('one of tp1');
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
		expect(stderr.join('')).toContain('schema and configuration match; nothing to push.');
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

	// Identity decisions are settled before the import so a later refusal never re-asks for them. That makes
	// a failed push write a tracked file, and the operator finds it in git status either way — so the failed
	// command has to be the thing that tells them, not the diff they run afterwards.
	it('names the ID map it wrote even when the push then fails', async () => {
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		// The icon makes the matched role a real update, so the batch is non-empty and the import runs.
		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor', icon: 'edit' }] },
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 't1', name: 'Editor' }]);

		interceptImport(
			{ mode: 'merge' },
			{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
			500,
		);

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);

		expect(stderr.join('')).toContain('Identity matches saved: directus/default/id_map.json');

		expect(readIdMapFile()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_roles: { sr1: 't1' } } } },
		});
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

	it('reports a data-only push as applied and changed on --json — the target DID change, with no schema hash', async () => {
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

		expect(JSON.parse(stdout.join(''))).toMatchObject({
			applied: true,
			changes: true,
			schemaSkipped: false,
			hash: null,
		});
	});

	it('refuses a project configuration pairing "schema": false with a collections scope', async () => {
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

	it('warns when local schema files exist under "schema": false instead of silently ignoring them', async () => {
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

	it('emits the push data block with the source and per-collection results on --json', async () => {
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
			project: 'default',
			mode: 'merge',
			applied: true,
			data: {
				mode: 'merge',
				source,
				incomplete: [],
				resultsByCollection: fullImportResult()['collections'],
			},
		});
	});

	it('leaves the ID map alone on a repeat push instead of claiming an update', async () => {
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
		const mark = stderr.length;
		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);
		const second = readFileSync(idMapPath, 'utf8');

		expect(second).toBe(first);
		expect(stderr.slice(mark).join('')).not.toContain('ID map updated');
	});
});
