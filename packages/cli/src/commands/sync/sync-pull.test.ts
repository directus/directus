import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	fullSnapshot,
	mockDefaultRecords,
	mockDiff,
	mockFields,
	mockList,
	mockSingleton,
	mockSnapshot,
	mockTotalCount,
	OWNED,
	ownedFileFor,
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

function interceptSingleton(path: string, object: Record<string, unknown>): void {
	mockSingleton(agent, path, object);
}

function interceptDefaultRecords(): void {
	mockDefaultRecords(agent);
}

describe('sync pull', () => {
	function twoCollectionSnapshot(): Record<string, unknown> {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [
				{ collection: 'articles', meta: { note: null } },
				{ collection: 'authors', meta: { note: null } },
			],
			fields: [
				{ collection: 'articles', field: 'title', type: 'string' },
				{ collection: 'authors', field: 'name', type: 'string' },
			],
			systemFields: [],
			relations: [],
		};
	}

	function scopedArticles(): Record<string, unknown> {
		return {
			version: 2,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: 'headline' } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};
	}

	function interceptSnapshot(): void {
		mockSnapshot(agent, fullSnapshot());
		mockFields(agent, []);
	}

	it('writes the source schema as committable files anchored to the config directory', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const schemaDir = join(dir, 'directus', 'default', 'schema');
		expect(existsSync(join(schemaDir, 'metadata.json'))).toBe(true);

		const owned = readdirSync(schemaDir).filter((name) => OWNED.test(name));
		expect(owned).toHaveLength(1);

		const ownedFile = owned[0];
		if (ownedFile === undefined) throw new Error('no owned file written');

		const parsed = JSON.parse(readFileSync(join(schemaDir, ownedFile), 'utf8'));
		expect(parsed.collection).toBe('articles');

		expect(stderr.join('')).toContain('Pulled from staging');

		const report = stdout.join('');
		expect(report).toMatch(/Schema {5}1 collection/);
		expect(report).toContain('directus/default/schema');
		expect(report).toContain('Resources');
	});

	it('emits a machine payload of ok:true, the snapshot counts, and the default data export on --json', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));

		expect(payload).toMatchObject({
			kind: 'PullReport',
			formatVersion: 1,
			ok: true,
			source: url,
			profile: 'staging',
			project: 'default',
			dir: 'directus/default/schema',
			collections: 1,
			fields: 1,
			systemFields: 0,
			relations: 0,
			files: 2,
			removed: [],
			scope: null,
		});

		expect(payload.data.collections).toBe(11);
		expect(payload.data.records).toBe(1);

		expect(new Set(payload.data.resources)).toEqual(
			new Set([
				'directus_access',
				'directus_dashboards',
				'directus_flows',
				'directus_folders',
				'directus_operations',
				'directus_panels',
				'directus_permissions',
				'directus_policies',
				'directus_roles',
				'directus_settings',
				'directus_translations',
			]),
		);
	});

	it('fails with a CONFIG error before any network call when no config exists', async () => {
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('No directus.config.json found.');
	});

	it('fails with an AUTH error naming the env var and never prompts when no credential resolves', async () => {
		seedConfig();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);

		expect(stderr.join('')).toContain('DIRECTUS_STAGING_TOKEN');

		const output = stdout.join('') + stderr.join('');
		expect(output).not.toMatch(/paste|log in|password/i);
	});

	it('refuses a schema directory that symlinks outside the project and writes nothing outside', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const outside = world.outsideDir();
		mkdirSync(join(dir, 'directus', 'default'), { recursive: true });
		symlinkSync(outside, join(dir, 'directus', 'default', 'schema'));

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toMatch(/outside the project/i);
		expect(readdirSync(outside)).toEqual([]);
	});

	it('refuses a symlinked ANCESTOR of the schema dir, not just the leaf', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const outside = world.outsideDir();
		symlinkSync(outside, join(dir, 'directus'));

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toMatch(/outside the project/i);
		expect(readdirSync(outside)).toEqual([]);
	});

	it('carries the include scope to the server and names it on the success line', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'articles' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: scopedArticles() }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'articles')).toBe(0);
		expect(stdout.join('')).toContain('(scoped to: articles)');
	});

	it('warns when a scoped pull commits a collection whose group parent is out of scope', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const groupedPages = {
			version: 2,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'pages', meta: { group: 'website' } }],
			fields: [{ collection: 'pages', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'pages' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: groupedPages }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'pages')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('does not include');
		expect(err).toContain('pages → website (group parent)');
	});

	it('warns when an explicitly requested collection is dropped from the snapshot (a typo or an old-server folder)', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const onlyPages = {
			version: 2,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'pages', meta: { group: null } }],
			fields: [{ collection: 'pages', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'pages,website_folder' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: onlyPages }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'pages,website_folder')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('not in the pulled schema: website_folder');
		expect(err).not.toContain('pages,');
		expect(err).not.toContain('does not include');
	});

	it('does not warn when the out-of-scope group parent is already committed from a prior full pull', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const fullWithGroup = {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [
				{ collection: 'website', meta: { group: null } },
				{ collection: 'pages', meta: { group: 'website' } },
			],
			fields: [
				{ collection: 'website', field: 'id', type: 'integer' },
				{ collection: 'pages', field: 'title', type: 'string' },
			],
			systemFields: [],
			relations: [],
		};

		agent
			.get(url)
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: fullWithGroup }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);
		stderr.length = 0;

		const scopedPages = {
			version: 2,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'pages', meta: { group: 'website' } }],
			fields: [{ collection: 'pages', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'pages' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: scopedPages }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'pages')).toBe(0);
		expect(stderr.join('')).not.toContain('does not include');
	});

	it('preserves out-of-scope siblings end to end when pulling a single collection', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const schemaDir = join(dir, 'directus', 'default', 'schema');

		agent
			.get(url)
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: twoCollectionSnapshot() }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		stdout.length = 0;

		const authorsFile = ownedFileFor(schemaDir, 'authors');
		const authorsBytes = readFileSync(join(schemaDir, authorsFile), 'utf8');

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'articles' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: scopedArticles() }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'articles', '--json')).toBe(0);

		expect(readFileSync(join(schemaDir, authorsFile), 'utf8')).toBe(authorsBytes);

		const manifest = JSON.parse(readFileSync(join(schemaDir, 'metadata.json'), 'utf8')).files;
		expect(manifest).toContain(authorsFile);

		expect(JSON.parse(stdout.join('')).scope).toEqual({ include: ['articles'] });
	});

	it('refuses --collections with --exclude-collections before any network call', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'a', '--exclude-collections', 'b')).toBe(1);
		expect(stderr.join('')).toContain('Pass --collections or --exclude-collections, not both.');
	});
});

describe('sync pull resources and data', () => {
	let dataDir: string;

	beforeEach(() => {
		dataDir = join(dir, 'directus', 'default', 'data');
	});

	function schemaBody(): Record<string, unknown> {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [
				{
					collection: 'articles',
					field: 'id',
					type: 'integer',
					schema: { is_primary_key: true },
				},
				{
					collection: 'articles',
					field: 'title',
					type: 'string',
					schema: { is_primary_key: false },
				},
			],
			systemFields: [],
			relations: [],
		};
	}

	function writeConfig(config: Record<string, unknown>): void {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify(config));
	}

	function interceptSnapshot(): void {
		mockSnapshot(agent, schemaBody());
		mockFields(agent, []);
	}

	function exportedCollections(): string[] {
		return readdirSync(dataDir)
			.filter((name) => OWNED.test(name))
			.map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')).collection)
			.sort();
	}

	it('exports every default resource but never users on a bare pull', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_flows',
			'directus_folders',
			'directus_operations',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
		]);
	});

	it('skips the snapshot on --no-schema and pulls resources only — secret stripping still guards', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-schema')).toBe(0);

		expect(exportedCollections()).toHaveLength(11);
		expect(stdout.join('')).toContain('Schema     skipped');
		expect(existsSync(join(dir, 'directus', 'default', 'schema', 'metadata.json'))).toBe(false);
	});

	it('reports schemaSkipped with a nulled schema block on --json for a "schema": false project', async () => {
		writeConfig({ profiles: { staging: { url } }, projects: { default: { schema: false } } });
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--json')).toBe(0);

		const report = JSON.parse(stdout.join(''));
		expect(report.schemaSkipped).toBe(true);
		expect(report.collections).toBeNull();
		expect(report.dir).toBeNull();
		expect(report.data.collections).toBe(11);
	});

	it('refuses --no-schema combined with a collections scope instead of guessing which wins', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-schema', '--collections', 'articles')).toBe(1);
		expect(stderr.join('')).toContain('skips the schema');
	});

	it('preserves committed data files a scoped re-pull did not fetch', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		interceptSnapshot();
		interceptList('/flows', [{ id: 'f1', name: 'Nightly' }]);
		interceptList('/operations', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_flows',
			'directus_folders',
			'directus_operations',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
		]);

		const flowsBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_flows')), 'utf8');
		expect(flowsBytes).toContain('Nightly');
	});

	it('strips creation stamps from flow exports — the server assigns them on create, breaking convergence', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		interceptList('/flows', [
			{ id: 'f1', name: 'Nightly', user_created: 'u1', date_created: '2026-07-27T19:22:14.564Z' },
		]);

		interceptList('/operations', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		const flows = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_flows')), 'utf8'));
		expect(flows.records).toEqual([{ id: 'f1', name: 'Nightly' }]);
	});

	it('includes users only when --users is named', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/users', []);
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--users')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_users',
		]);
	});

	it('exports every config resource including users under --all', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/users', []);
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--all')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_flows',
			'directus_folders',
			'directus_operations',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
			'directus_users',
		]);
	});

	it('composes --all with --no-flows to subtract a resource and its dependent child', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/users', []);
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);
		interceptList('/dashboards', []);
		interceptList('/panels', []);
		interceptList('/folders', []);
		interceptList('/translations', []);
		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging', '--all', '--no-flows')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_folders',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
			'directus_users',
		]);
	});

	it('expands a named resource to its full closure by default, and severs it under --no-deps', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--roles')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
		]);

		rmSync(dataDir, { recursive: true, force: true });

		interceptSnapshot();
		interceptList('/roles', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--roles', '--no-deps')).toBe(0);
		expect(exportedCollections()).toEqual(['directus_roles']);
	});

	it('honors deps:false from project config so a CI pull can reproduce a --no-deps checkout', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({
				profiles: { staging: { url } },
				projects: { default: { resources: ['roles'], deps: false } },
			}),
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);
		expect(exportedCollections()).toEqual(['directus_roles']);
	});

	it('subtracts a resource and any child that only rode in through it under --no-flows', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);
		interceptList('/dashboards', []);
		interceptList('/panels', []);
		interceptList('/folders', []);
		interceptList('/translations', []);
		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-flows')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_folders',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
		]);
	});

	it('refuses --all combined with a named resource before any network call', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--all', '--roles')).toBe(1);
		expect(stderr.join('')).toContain('--all already includes every resource');
	});

	it('refuses a positive resource combined with a negative before any network call', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--roles', '--no-flows')).toBe(1);
		expect(stderr.join('')).toContain('Name the resources you want');
	});

	it('never writes secrets or alias views to disk', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		interceptList('/users', [
			{
				id: 'u1',
				email: 'editor@example.com',
				token: 'super-secret-static-token',
				password: 'hashed-password',
				tfa_secret: 'tfa-seed',
				auth_data: '{"refresh_token":"oauth-refresh-secret"}',
				avatar: 'file-1',
				last_access: '2020-01-01',
				last_page: '/content',
			},
		]);

		interceptList('/roles', [
			{
				id: 'r1',
				name: 'Editor',
				users: ['u1'],
				policies: ['p1'],
				children: [],
			},
		]);

		interceptList('/policies', [{ id: 'p1', name: 'Standard' }]);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--users')).toBe(0);

		const roleBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_roles')), 'utf8');
		expect(roleBytes).not.toContain('"users"');
		expect(roleBytes).not.toContain('"policies"');
		expect(roleBytes).not.toContain('"children"');

		const userBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_users')), 'utf8');
		expect(userBytes).not.toContain('token');
		expect(userBytes).not.toContain('password');
		expect(userBytes).not.toContain('tfa_secret');
		expect(userBytes).not.toContain('auth_data');
		expect(userBytes).not.toContain('oauth-refresh-secret');
		expect(userBytes).not.toContain('avatar');
		expect(userBytes).not.toContain('super-secret-static-token');
		expect(userBytes).toContain('editor@example.com');
	});

	it('strips custom conceal/hash fields the field catalog marks sensitive and names them at pull time', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		mockSnapshot(agent, schemaBody());

		mockFields(agent, [
			{ collection: 'directus_settings', field: 'api_key', type: 'string', meta: { special: ['conceal'] } },
			{ collection: 'directus_settings', field: 'webhook_signature', type: 'string', meta: { special: ['hash'] } },
			{ collection: 'directus_settings', field: 'license_key', type: 'string', meta: { special: ['conceal'] } },
			{ collection: 'directus_settings', field: 'project_name', type: 'string', meta: null },
		]);

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/permissions',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', {
			id: 1,
			project_name: 'Kampala',
			api_key: 'sk-live-4242',
			webhook_signature: 'hmac-secret-seed',
			license_key: 'lic-secret',
		});

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const settingsBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_settings')), 'utf8');
		expect(settingsBytes).not.toContain('api_key');
		expect(settingsBytes).not.toContain('sk-live-4242');
		expect(settingsBytes).not.toContain('webhook_signature');
		expect(settingsBytes).not.toContain('hmac-secret-seed');
		expect(settingsBytes).not.toContain('lic-secret');
		expect(settingsBytes).toContain('Kampala');

		const err = stderr.join('');
		expect(err).toContain('api_key');
		expect(err).toContain('webhook_signature');
		expect(err).not.toContain('license_key');
	});

	it('strips a custom conceal field on directus_settings even when the pull is scoped to another collection', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'articles' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: schemaBody() }, { headers: { 'content-type': 'application/json' } });

		mockFields(agent, [
			{ collection: 'directus_settings', field: 'api_key', type: 'string', meta: { special: ['conceal'] } },
		]);

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/permissions',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1, api_key: 'sk-live-4242' });

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'articles')).toBe(0);

		const settingsBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_settings')), 'utf8');
		expect(settingsBytes).not.toContain('api_key');
		expect(settingsBytes).not.toContain('sk-live-4242');
		expect(stderr.join('')).toContain('api_key');
	});

	it('fails the pull when the field catalog read fails — secret stripping must not degrade silently', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		mockSnapshot(agent, schemaBody());

		agent
			.get(url)
			.intercept({ path: '/fields', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(existsSync(join(dir, 'directus'))).toBe(false);
	});

	it('warns when a request operation carries custom headers — credential-bearing and committed verbatim', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/flows', [{ id: 'f1', name: 'Nightly' }]);

		interceptList('/operations', [
			{
				id: 'o1',
				key: 'notify_slack',
				type: 'request',
				flow: 'f1',
				options: {
					url: 'https://hooks.example.com',
					headers: [{ header: 'Authorization', value: 'Bearer live-secret' }],
				},
			},
		]);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('notify_slack');
		expect(err).toMatch(/credential/i);

		const opsBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_operations')), 'utf8');
		expect(opsBytes).toContain('Bearer live-secret');
	});

	it('stays silent for request operations without headers — an always-on warning trains operators to ignore it', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/flows', []);

		interceptList('/operations', [
			{ id: 'o1', key: 'fetch_page', type: 'request', options: { url: 'https://example.com', headers: [] } },
			{ id: 'o2', key: 'log_it', type: 'log', options: { headers: [{ header: 'X-Debug', value: '1' }] } },
		]);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);
		expect(stderr.join('')).not.toMatch(/credential/i);
	});

	it('re-pulls byte-identical files from an unchanged source — nondeterministic output makes git diffs lie', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const registerMocks = (): void => {
			interceptSnapshot();
			interceptList('/roles', [{ id: 'r1', name: 'Editor' }]);
			interceptList('/policies', []);
			interceptList('/access', []);
			interceptList('/permissions', []);

			interceptList('/flows', [
				{ id: 'f1', name: 'Nightly' },
				{ id: 'f2', name: 'Weekly' },
			]);

			interceptList('/operations', []);
			interceptList('/dashboards', []);
			interceptList('/panels', []);
			interceptList('/folders', []);
			interceptList('/translations', []);
			interceptSingleton('/settings', { id: 1, project_name: 'Kampala' });
		};

		registerMocks();
		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const schemaDir = join(dir, 'directus', 'default', 'schema');

		const treeOf = (root: string): Record<string, string> =>
			Object.fromEntries(readdirSync(root).map((name) => [name, readFileSync(join(root, name), 'utf8')]));

		const schemaBefore = treeOf(schemaDir);
		const dataBefore = treeOf(dataDir);

		registerMocks();
		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(treeOf(schemaDir)).toEqual(schemaBefore);
		expect(treeOf(dataDir)).toEqual(dataBefore);
	});

	it('writes nothing at all when a data fetch fails — no mixed generations', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		agent
			.get(url)
			.intercept({
				path: '/access',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);

		expect(existsSync(join(dir, 'directus'))).toBe(false);
	});

	it('writes nothing when a fetched record lacks its primary key', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', [{ name: 'No key' }]);

		for (const path of [
			'/policies',
			'/access',
			'/permissions',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);

		expect(stderr.join('')).toContain('primary key');
		expect(existsSync(join(dir, 'directus'))).toBe(false);
	});

	it('exports only stored permissions — appended app-access rows never reach disk', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		const derived = { policy: null, collection: 'directus_settings', action: 'read', system: true };
		const stored = { id: 1, policy: 'p1', collection: 'articles', action: 'read' };

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [stored, derived] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: 1 } }) },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [derived] }, { headers: { 'content-type': 'application/json' } });

		mockTotalCount(agent, '/permissions', 1);

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const permissions = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_permissions')), 'utf8'));
		expect(permissions.records).toEqual([stored]);
	});

	it('marks a truncated permissions export incomplete instead of committing the shortfall silently', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		const visible = { id: 5, policy: 'p1', collection: 'articles', action: 'read' };

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [visible] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: 5 } }) },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		mockTotalCount(agent, '/permissions', 3);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(stderr.join('')).toContain('exported 1 of 3 rows');
		expect(stderr.join('')).toContain('mirror pushes will refuse');

		const metadata = JSON.parse(readFileSync(join(dataDir, 'metadata.json'), 'utf8'));
		expect(metadata.incomplete).toEqual(['directus_permissions']);
	});

	it('confirms an unlicensed cause of a permissions shortfall from the /license entitlement', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		const visible = { id: 5, policy: 'p1', collection: 'articles', action: 'read' };

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [visible] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: 5 } }) },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		mockTotalCount(agent, '/permissions', 3);

		agent
			.get(url)
			.intercept({ path: '/license', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(
				200,
				{ data: { entitlements: { custom_permission_rules_enabled: { override: null, default: false } } } },
				{ headers: { 'content-type': 'application/json' } },
			);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('exported 1 of 3 rows');
		expect(err).toContain('Confirmed: this instance is unlicensed for custom permission rules');
	});

	it('refuses a cross-source pull before ANY write or request — schema and data stay byte-identical', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url }, other: { url: 'https://other.example.com' } } }),
		);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		vi.stubEnv('DIRECTUS_OTHER_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const schemaDir = join(dir, 'directus', 'default', 'schema');

		const treeOf = (root: string): Record<string, string> =>
			Object.fromEntries(readdirSync(root).map((name) => [name, readFileSync(join(root, name), 'utf8')]));

		const schemaBefore = treeOf(schemaDir);
		const dataBefore = treeOf(dataDir);
		stderr.length = 0;

		expect(await d6s('sync', 'pull', '--from', 'other')).toBe(1);

		expect(stderr.join('')).toContain('came from');
		expect(treeOf(schemaDir)).toEqual(schemaBefore);
		expect(treeOf(dataDir)).toEqual(dataBefore);
	});

	it('marks the export incomplete when the completeness probe cannot answer — unknown is not complete', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		const visible = { id: 5, policy: 'p1', collection: 'articles', action: 'read' };

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [visible] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: 5 } }) },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '0', meta: 'total_count' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(500, { errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(stderr.join('')).toContain('could not verify');

		const metadata = JSON.parse(readFileSync(join(dataDir, 'metadata.json'), 'utf8'));
		expect(metadata.incomplete).toEqual(['directus_permissions']);
	});

	it('carries the incomplete marker through a scoped re-pull, and mirror push still refuses', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptSnapshot();

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/folders',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		const visible = { id: 5, policy: 'p1', collection: 'articles', action: 'read' };

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [visible] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get(url)
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: 5 } }) },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		mockTotalCount(agent, '/permissions', 3);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		interceptSnapshot();
		interceptList('/flows', []);
		interceptList('/operations', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		const metadata = JSON.parse(readFileSync(join(dataDir, 'metadata.json'), 'utf8'));
		expect(metadata.incomplete).toEqual(['directus_permissions']);

		mockDiff(agent, 'mirror', null);
		mockDefaultRecords(agent);
		stderr.length = 0;

		expect(
			await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--dangerously-allow-delete', '--yes'),
		).toBe(1);

		expect(stderr.join('')).toMatch(/refusing mirror/i);
		expect(stderr.join('')).toContain('directus_permissions');
	});

	it('drops user-attached access rows when users are out of scope', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);

		interceptList('/access', [
			{ id: 'a1', role: 'r1', user: null },
			{ id: 'a2', policy: 'p1', user: 'u1' },
		]);

		interceptList('/permissions', []);
		interceptList('/flows', []);
		interceptList('/operations', []);
		interceptList('/dashboards', []);
		interceptList('/panels', []);
		interceptList('/folders', []);
		interceptList('/translations', []);
		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const access = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_access')), 'utf8'));
		expect(access.records).toEqual([{ id: 'a1', role: 'r1', user: null }]);
	});

	it('keeps user-attached access rows when users are in scope', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/users', []);
		interceptList('/roles', []);
		interceptList('/policies', []);

		interceptList('/access', [
			{ id: 'a1', role: 'r1', user: null },
			{ id: 'a2', policy: 'p1', user: 'u1' },
		]);

		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--users', '--roles', '--policies')).toBe(0);

		const access = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_access')), 'utf8'));

		expect(access.records).toEqual([
			{ id: 'a1', role: 'r1', user: null },
			{ id: 'a2', policy: 'p1', user: 'u1' },
		]);
	});

	it('keeps user-attached access rows on a re-pull that preserves a committed users export, and warns it is stale', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const bothRows = [
			{ id: 'a1', role: 'r1', user: null },
			{ id: 'a2', policy: 'p1', user: 'u1' },
		];

		interceptSnapshot();
		interceptList('/users', [{ id: 'u1', email: 'editor@example.com' }]);
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', bothRows);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--users')).toBe(0);

		const accessRecords = (): unknown =>
			JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_access')), 'utf8')).records;

		expect(accessRecords()).toEqual(bothRows);
		stderr.length = 0;

		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', bothRows);
		interceptList('/permissions', []);
		interceptList('/flows', []);
		interceptList('/operations', []);
		interceptList('/dashboards', []);
		interceptList('/panels', []);
		interceptList('/folders', []);
		interceptList('/translations', []);
		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(exportedCollections()).toContain('directus_users');
		expect(accessRecords()).toEqual(bothRows);

		expect(stderr.join('')).toContain('did not refresh');
		expect(stderr.join('')).toContain('--users');
	});

	it('refuses a project that is not declared in config', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--project', 'prod')).toBe(1);
		expect(stderr.join('')).toContain('Unknown project');
	});

	it('refuses a path-like project name before any filesystem or network work', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--project', '../evil')).toBe(1);
		expect(stderr.join('')).toContain('Invalid project name');
	});

	it('drives a bare pull from a declared project scope, and lets a boolean flag override it', async () => {
		writeConfig({
			profiles: { staging: { url } },
			projects: { default: { resources: ['roles'] } },
		});

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
		]);

		rmSync(dataDir, { recursive: true, force: true });

		interceptSnapshot();
		interceptList('/translations', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--translations')).toBe(0);
		expect(exportedCollections()).toEqual(['directus_translations']);
	});

	it('subtracts a configured excludeResources list from the default set', async () => {
		writeConfig({
			profiles: { staging: { url } },
			projects: { default: { excludeResources: ['flows'] } },
		});

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);
		interceptList('/dashboards', []);
		interceptList('/panels', []);
		interceptList('/folders', []);
		interceptList('/translations', []);
		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_folders',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
		]);
	});

	it('refuses a project that sets both resources and excludeResources', async () => {
		writeConfig({
			profiles: { staging: { url } },
			projects: { default: { resources: ['roles'], excludeResources: ['flows'] } },
		});

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('sets both resources and excludeResources');
	});

	it('refuses a configured excludeResources naming a non-selectable resource', async () => {
		writeConfig({
			profiles: { staging: { url } },
			projects: { default: { excludeResources: ['operations'] } },
		});

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Cannot exclude "operations"');
	});

	it('lands artifacts under a configured directory key', async () => {
		writeConfig({ profiles: { staging: { url } }, directory: 'cms' });
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(existsSync(join(dir, 'cms', 'default', 'schema', 'metadata.json'))).toBe(true);
		expect(existsSync(join(dir, 'cms', 'default', 'data', 'metadata.json'))).toBe(true);
	});

	it('enforces containment against a configured directory that symlinks outside the project', async () => {
		writeConfig({ profiles: { staging: { url } }, directory: 'cms' });
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const outside = world.outsideDir();
		symlinkSync(outside, join(dir, 'cms'));

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toMatch(/outside the project/i);
		expect(readdirSync(outside)).toEqual([]);
	});
});
