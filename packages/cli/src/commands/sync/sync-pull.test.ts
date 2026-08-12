import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCredential } from '../../kernel/config/credentials.js';
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

	it('writes the source schema into local files anchored to the configuration directory', async () => {
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
		expect(report).toMatch(/Schema {9}1 collection/);
		expect(report).toContain('directus/default/schema');
		expect(report).toContain('Configuration');
	});

	it('emits the schema and configuration pull report on --json', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--json')).toBe(0);

		const payload = JSON.parse(stdout.join(''));

		expect(payload).toMatchObject({
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

		expect(payload.data).toMatchObject({ recordCount: 1, collectionCount: 11, fileCount: 12 });

		expect(new Set(payload.data.resources)).toEqual(
			new Set([
				'access',
				'dashboards',
				'flows',
				'folders',
				'operations',
				'panels',
				'permissions',
				'policies',
				'roles',
				'settings',
				'translations',
			]),
		);

		expect(new Set(payload.data.collections)).toEqual(
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

	it('fails with a CONFIG error before any network call when no configuration exists', async () => {
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('No directus.config.json found.');
	});

	it('explains that CI ignores a saved credential and requires the profile env token', async () => {
		seedConfig();
		saveCredential(url, 'staging', 'stored-token');

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);

		expect(stderr.join('')).toContain('CI token missing for profile "staging".');

		expect(stderr.join('')).toContain(
			'Set DIRECTUS_STAGING_TOKEN in your CI environment. Saved profile credentials are local-only and are not read in CI.',
		);

		expect(stderr.join('')).not.toContain('profile test-connection');

		const output = stdout.join('') + stderr.join('');
		expect(output).not.toMatch(/paste|log in|password/i);
	});

	it('refuses a source below the Environment Sync floor, naming both versions', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		agent
			.get(url)
			.intercept({ path: '/server/info', method: 'GET' })
			.reply(200, { data: { version: '12.1.0' } }, { headers: { 'content-type': 'application/json' } });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('Environment Sync needs Directus 12.2.0 or later; "staging" runs 12.1.0.');
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

	it('does not warn when the out-of-scope group parent is stored from a prior full pull', async () => {
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

	it('warns when a scoped pull brings a new relation but leaves the paired field stale on disk', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const fullWithoutRelation = {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles' }, { collection: 'authors' }],
			fields: [
				{ collection: 'articles', field: 'title', type: 'string' },
				{ collection: 'authors', field: 'name', type: 'string' },
			],
			systemFields: [],
			relations: [],
		};

		agent
			.get(url)
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: fullWithoutRelation }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);
		stderr.length = 0;

		// The source has since gained articles.author with its corresponding o2m field on authors, but this
		// pull only rewrites articles — the authors file on disk still predates the relation.
		const scopedArticlesWithRelation = {
			version: 2,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles' }],
			fields: [
				{ collection: 'articles', field: 'title', type: 'string' },
				{ collection: 'articles', field: 'author', type: 'uuid' },
			],
			systemFields: [],
			relations: [
				{ collection: 'articles', field: 'author', related_collection: 'authors', meta: { one_field: 'articles' } },
			],
		};

		agent
			.get(url)
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'articles' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: scopedArticlesWithRelation }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'articles')).toBe(0);

		const err = stderr.join('');

		expect(err).toContain(
			'This pull is missing half of 1 relation. Pushing may leave this relation broken on the target:',
		);

		expect(err).toContain('articles.author → authors: missing the corresponding field authors.articles');
		expect(err).toContain('To include the relation: pull with --collections articles,authors');
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

	function pulledCollections(): string[] {
		return readdirSync(dataDir)
			.filter((name) => OWNED.test(name))
			.map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')).collection)
			.sort();
	}

	it('pulls every default resource but never users on a bare pull', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(pulledCollections()).toEqual([
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

	it('excludes translations when --no-translations is passed', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

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
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-translations')).toBe(0);
		expect(pulledCollections()).not.toContain('directus_translations');
	});

	it('skips the snapshot on --no-schema and pulls resources only — secret stripping still guards', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-schema')).toBe(0);

		expect(pulledCollections()).toHaveLength(11);
		expect(stdout.join('')).toContain('Schema         skipped');
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
		expect(report.data.collectionCount).toBe(11);
	});

	it('refuses --no-schema combined with a collections scope instead of guessing which wins', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-schema', '--collections', 'articles')).toBe(1);
		expect(stderr.join('')).toContain('skips the schema');
	});

	it('preserves stored data files a scoped re-pull did not fetch', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		interceptSnapshot();
		interceptList('/flows', [{ id: 'f1', name: 'Nightly' }]);
		interceptList('/operations', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		expect(pulledCollections()).toEqual([
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

	it('strips creation stamps from pulled flows — the server assigns them on create, breaking convergence', async () => {
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

		expect(pulledCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_users',
		]);
	});

	it('pulls every configuration resource including users under --all', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/users', []);
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--all')).toBe(0);

		expect(pulledCollections()).toEqual([
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

		expect(pulledCollections()).toEqual([
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

		expect(pulledCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
		]);

		rmSync(dataDir, { recursive: true, force: true });

		interceptSnapshot();
		interceptList('/roles', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--roles', '--no-deps')).toBe(0);
		expect(pulledCollections()).toEqual(['directus_roles']);
	});

	it('honors deps:false from project configuration so a CI pull can reproduce a --no-deps checkout', async () => {
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
		expect(pulledCollections()).toEqual(['directus_roles']);
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

		expect(pulledCollections()).toEqual([
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

	// Dependency expansion would otherwise pull the excluded resource back in without a word.
	it('refuses an exclusion a retained resource would pull back, naming the dependent', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-policies')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('Cannot exclude "policies"');
		expect(err).toContain('"roles" requires it');
		expect(err).toContain('Exclude "roles" as well');
	});

	it('excludes cleanly when the dependent is excluded along with its dependency', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		for (const path of ['/flows', '/operations', '/dashboards', '/panels', '/folders', '/translations']) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging', '--no-policies', '--no-roles')).toBe(0);
		expect(pulledCollections()).not.toContain('directus_policies');
		expect(pulledCollections()).not.toContain('directus_roles');
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

	// A malformed catalog entry could hide "conceal"; passing it as non-sensitive would commit a secret.
	it('fails the pull on malformed field catalog metadata instead of treating the field as non-sensitive', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		mockSnapshot(agent, schemaBody());

		mockFields(agent, [{ collection: 'directus_settings', field: 'api_key', type: 'string', meta: 'conceal' }]);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('directus_settings.api_key');
		expect(existsSync(join(dir, 'directus'))).toBe(false);
	});

	it('fails the pull when a field catalog "special" is not an array instead of skipping it', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		mockSnapshot(agent, schemaBody());

		mockFields(agent, [
			{ collection: 'directus_settings', field: 'api_key', type: 'string', meta: { special: 'conceal' } },
		]);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('directus_settings.api_key');
		expect(existsSync(join(dir, 'directus'))).toBe(false);
	});

	it('warns when a request operation carries custom headers — credential-bearing and pulled verbatim', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/flows', [{ id: 'f1', name: 'Nightly' }]);

		interceptList('/operations', [
			{
				id: 'o1',
				name: 'Notify Slack',
				key: 'notify_slack',
				type: 'request',
				flow: 'f1',
				options: {
					url: 'https://hooks.example.com',
					headers: [{ header: 'Authorization', value: 'Bearer live-secret' }],
				},
			},
			{
				id: 'o2',
				name: null,
				key: 'call_billing',
				type: 'request',
				flow: 'f1',
				options: { url: 'https://billing.example.com', headers: [{ header: 'X-Api-Key', value: 'live-key' }] },
			},
		]);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		// Operators locate the operation by the name the Data Studio shows; an unnamed one falls back to its key.
		const err = stderr.join('');
		expect(err).toContain('Notify Slack');
		expect(err).toContain('call_billing');
		expect(err).toMatch(/credential/i);

		const opsBytes = readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_operations')), 'utf8');
		expect(opsBytes).toContain('Bearer live-secret');
	});

	it('warns for credentials carried in a request operation URL or body, naming what carries them', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/flows', [{ id: 'f1', name: 'Nightly' }]);

		interceptList('/operations', [
			{
				id: 'o1',
				name: 'Call Billing',
				key: 'call_billing',
				type: 'request',
				flow: 'f1',
				options: { url: 'https://billing.example.com?api_key=live-key', headers: [], body: '{"token":"live-token"}' },
			},
		]);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--flows')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('Call Billing (URL, body)');
		expect(err).toMatch(/credential/i);
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

	it('pulls only stored permissions — appended app-access records never reach disk', async () => {
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

	it('marks a truncated permissions pull incomplete instead of storing the shortfall silently', async () => {
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

		expect(stderr.join('')).toContain('pulled 1 of 3 records');
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
		expect(err).toContain('pulled 1 of 3 records');
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

	it('marks the pull incomplete when the completeness probe cannot answer — unknown is not complete', async () => {
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

	it('drops user-attached access records when users are out of scope', async () => {
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

	it('keeps user-attached access records when users are in scope', async () => {
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

	it('keeps user-attached access records on a re-pull that preserves local users, and warns it is stale', async () => {
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

		expect(pulledCollections()).toContain('directus_users');
		expect(accessRecords()).toEqual(bothRows);

		expect(stderr.join('')).toContain('did not refresh');
		expect(stderr.join('')).toContain('--users');
	});

	it('refuses a project that is not declared in configuration', async () => {
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

		expect(pulledCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
		]);

		rmSync(dataDir, { recursive: true, force: true });

		interceptSnapshot();
		interceptList('/translations', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--translations')).toBe(0);
		expect(pulledCollections()).toEqual(['directus_translations']);
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

		expect(pulledCollections()).toEqual([
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
