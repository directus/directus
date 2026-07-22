import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	fullSnapshot,
	mockDefaultRecords,
	mockList,
	mockSingleton,
	mockSnapshot,
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
	}

	it('writes the source schema as committable files anchored to the config directory', async () => {
		// Proves the full path lands deterministic files under directus/default/schema and that
		// the human line names the count and destination the operator will commit.
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

		// The headline names source and URL on the status channel; the per-axis report lines (schema /
		// resources / content) print to stdout with the destinations the operator will commit.
		expect(stderr.join('')).toContain('Pulled from staging');

		const report = stdout.join('');
		expect(report).toMatch(/Schema {5}1 collection/);
		expect(report).toContain('directus/default/schema');
		expect(report).toContain('Content    none — add --content');
	});

	it('emits a machine payload of ok:true, the snapshot counts, and the default data export on --json', async () => {
		// CI consumes this shape to decide whether a pull produced changes. `data` is always an object
		// (every pull exports the default resource set), and `content`/`project` are top-level.
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
			content: [],
		});

		// The default set is every selectable resource except users; settings contributes its one
		// singleton row, the rest are stubbed empty.
		expect(payload.data.collections).toBe(10);
		expect(payload.data.records).toBe(1);

		expect(new Set(payload.data.resources)).toEqual(
			new Set([
				'directus_access',
				'directus_dashboards',
				'directus_flows',
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
		// Pull must fail actionably before touching the network; disableNetConnect turns any stray
		// request into a throw, so reaching exit 1 with the CONFIG message proves nothing was sent.
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toContain('No directus.config.json found.');
	});

	it('fails with an AUTH error naming the env var and never prompts when no credential resolves', async () => {
		// The CI operator's fix must be in the error itself; and pull is prompt-free, so no
		// interactive artifact may reach either stream even when the credential is missing.
		seedConfig();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);

		expect(stderr.join('')).toContain('DIRECTUS_STAGING_TOKEN');

		const output = stdout.join('') + stderr.join('');
		expect(output).not.toMatch(/paste|log in|password/i);
	});

	it('refuses a schema directory that symlinks outside the project and writes nothing outside', async () => {
		// Repo content must never redirect sync writes outside the repo: a schema dir symlinked to a
		// directory outside the project tree is a containment escape, so pull must refuse before the
		// fetch and leave the outside target empty. No intercept is registered — the disabled dispatcher
		// would throw on any stray request, so reaching exit 1 proves nothing was fetched or written.
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
		// The escape the leaf check misses: `directus` symlinks to an existing outside dir while
		// `default/schema` does not exist yet, so an exists-only check on the full path never fires
		// and mkdir would create the tail through the symlink. Containment must anchor on the
		// deepest existing ancestor.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const outside = world.outsideDir();
		symlinkSync(outside, join(dir, 'directus'));

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toMatch(/outside the project/i);
		expect(readdirSync(outside)).toEqual([]);
	});

	it('carries the include scope to the server and names it on the success line', async () => {
		// The scope must reach the wire or a "scoped" pull silently pulls everything: the intercept only
		// matches when includeCollections=articles rides the query, and the human line must name the scope.
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

		// The schema scope narrows only the schema; the default resource data export still runs.
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--collections', 'articles')).toBe(0);
		expect(stdout.join('')).toContain('(scoped to: articles)');
	});

	it('preserves out-of-scope siblings end to end when pulling a single collection', async () => {
		// Pulling one collection must never destroy the committed schema around it: a full pull writes
		// articles + authors, then a scoped pull of only
		// articles must leave the authors artifact byte-identical on disk and still owned in the manifest,
		// and its --json payload must carry the scope it pulled.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const schemaDir = join(dir, 'directus', 'default', 'schema');

		agent
			.get(url)
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: twoCollectionSnapshot() }, { headers: { 'content-type': 'application/json' } });

		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		// The first (human-mode) pull prints its report to stdout; clear it so the --json run's payload
		// is the only stdout content parsed below.
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
		// Mutual exclusivity is a client-side contract, not a server 400: passing both fails USAGE with a
		// clean message and never reaches the wire. No intercept — the disabled dispatcher would throw on one.
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
	}

	function exportedCollections(): string[] {
		return readdirSync(dataDir)
			.filter((name) => OWNED.test(name))
			.map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')).collection)
			.sort();
	}

	it('exports every default resource but never users on a bare pull', async () => {
		// A bare pull ships the config graph except users. /users is not
		// registered, so a stray fetch of it would throw on the disabled dispatcher.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_flows',
			'directus_operations',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
		]);
	});

	it('includes users only when --resources names them', async () => {
		// Users ride in exactly via --resources users, dragging their role/policy closure with them.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/users', []);
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'users')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_users',
		]);
	});

	it('expands a resource to its full closure by default', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'roles')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
		]);
	});

	it('severs the selectable closure under --no-deps but keeps dependent children', async () => {
		// --no-deps drops the selectable edge roles→policies, so roles resolves alone; but policies→access/
		// permissions is selection semantics and still rides. Two pulls prove both halves; only the endpoints
		// each pull should hit are registered, so a leak would throw.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptSnapshot();
		interceptList('/roles', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'roles', '--no-deps')).toBe(0);
		expect(exportedCollections()).toEqual(['directus_roles']);

		rmSync(dataDir, { recursive: true, force: true });

		interceptSnapshot();
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'policies', '--no-deps')).toBe(0);
		expect(exportedCollections()).toEqual(['directus_access', 'directus_permissions', 'directus_policies']);
	});

	it('honors deps:false from project config so a CI pull can reproduce a --no-deps checkout', async () => {
		// The spec promises every selection key on flags is available in project config; deps had no config
		// equivalent, so a configured scope could not sever the selectable closure without someone
		// remembering to pass --no-deps on every invocation.
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

	it('drops a resource and any child that only rode in through it under --exclude-resources', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptList('/roles', []);
		interceptList('/policies', []);
		interceptList('/access', []);
		interceptList('/permissions', []);
		interceptList('/dashboards', []);
		interceptList('/panels', []);
		interceptList('/translations', []);
		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging', '--exclude-resources', 'flows')).toBe(0);

		expect(exportedCollections()).toEqual([
			'directus_access',
			'directus_dashboards',
			'directus_panels',
			'directus_permissions',
			'directus_policies',
			'directus_roles',
			'directus_settings',
			'directus_translations',
		]);
	});

	it('refuses --resources with --exclude-resources before any network call', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'roles', '--exclude-resources', 'flows')).toBe(
			1,
		);

		expect(stderr.join('')).toContain('Pass --resources or --exclude-resources, not both.');
	});

	it('never writes secrets or alias views to disk', async () => {
		// The secrets-never-on-disk property, checked against the written BYTES not just the parsed shape: a
		// role's alias arrays (users/policies/children) and a user's sensitive columns (token/password/…)
		// must be absent from the artifacts entirely.
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

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'users')).toBe(0);

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

	it('writes nothing at all when a data fetch fails — no mixed generations', async () => {
		// Record fetches finish before either artifact writer starts, so this failure leaves both generations untouched.
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
		// A key-less row (field permissions can hide the column) would land on disk as an artifact the
		// reader refuses — a pull that "succeeds" but leaves diff/push failing STATE. The fetch boundary
		// refuses first, and because every fetch precedes every write, the committed tree stays untouched.
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
		// Real instances append the app-access minimal permissions (system: true, no id) to every
		// authenticated /permissions read, on every page. Exporting them would commit derived runtime
		// state and a later push would materialize duplicates of built-in behavior as real target rows.
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
				query: { limit: '-1', sort: 'id', offset: '0' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [stored, derived] }, { headers: { 'content-type': 'application/json' } });

		for (const path of [
			'/roles',
			'/policies',
			'/access',
			'/flows',
			'/operations',
			'/dashboards',
			'/panels',
			'/translations',
		]) {
			interceptList(path, []);
		}

		interceptSingleton('/settings', { id: 1 });

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		const permissions = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_permissions')), 'utf8'));
		expect(permissions.records).toEqual([stored]);
	});

	it('drops user-attached access rows when users are out of scope', async () => {
		// directus-sync #148: a user-attached access row references an unsynced user (missing-FK on import).
		// A bare pull (users out of scope) must keep only the null-user grant.
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

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'users,roles,policies')).toBe(0);

		const access = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'directus_access')), 'utf8'));

		expect(access.records).toEqual([
			{ id: 'a1', role: 'r1', user: null },
			{ id: 'a2', policy: 'p1', user: 'u1' },
		]);
	});

	it('exports a content collection from the pulled schema and reports it', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();
		interceptList('/items/articles', [{ id: 1, title: 'First' }]);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--content', 'articles', '--json')).toBe(0);

		const article = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'articles')), 'utf8'));
		expect(article.primaryKey).toBe('id');
		expect(article.records).toEqual([{ id: 1, title: 'First' }]);
		expect(JSON.parse(stdout.join('')).content).toEqual(['articles']);
	});

	it('strips conceal/encrypt/hash content fields at export — masks and hashes cannot round-trip', async () => {
		// The server reads a conceal/encrypt field as '**********' and RE-hashes anything written to a hash
		// field, so exporting them would commit masks to git and a later push would overwrite the target's
		// real secret with the mask (or corrupt its hash). The field is dropped from the export — an absent
		// field is never written by the import, so the target keeps its own value — and the pull says so.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const body = schemaBody();

		(body['fields'] as Record<string, unknown>[]).push({
			collection: 'articles',
			field: 'api_key',
			type: 'string',
			meta: { special: ['conceal'] },
			schema: { is_primary_key: false },
		});

		mockSnapshot(agent, body);
		interceptDefaultRecords();
		interceptList('/items/articles', [{ id: 1, title: 'First', api_key: '**********' }]);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--content', 'articles')).toBe(0);

		const article = JSON.parse(readFileSync(join(dataDir, ownedFileFor(dataDir, 'articles')), 'utf8'));
		expect(article.records).toEqual([{ id: 1, title: 'First' }]);
		expect(stderr.join('')).toContain('exported without api_key');
	});

	it('routes a config resource named as --content to --resources', async () => {
		// Fail after schema fetch but before either artifact writer or any record fetch.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--content', 'roles')).toBe(1);
		expect(stderr.join('')).toContain('--resources');
	});

	it('refuses a project that is not declared in config', async () => {
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--project', 'prod')).toBe(1);
		expect(stderr.join('')).toContain('Unknown project');
	});

	it('refuses a path-like project name before any filesystem or network work', async () => {
		// The project name becomes a path segment of the artifact tree; a "../"-bearing or slash-bearing
		// name would escape or nest the containment root, so anything outside the safe charset is refused.
		// No intercept is registered — the disabled dispatcher would throw on a stray request.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--project', '../evil')).toBe(1);
		expect(stderr.join('')).toContain('Invalid project name');
	});

	it('drives a bare pull from a declared project scope, and lets a flag override it', async () => {
		// A project's scope config supplies the resource set when no flag is present; a flag overrides it.
		// First pull: config resources ['roles'] → only the roles closure. Second: --resources translations
		// wins. Endpoints outside each expected set are unregistered, so a leak would throw.
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

		expect(await d6s('sync', 'pull', '--from', 'staging', '--resources', 'translations')).toBe(0);
		expect(exportedCollections()).toEqual(['directus_translations']);
	});

	it('lands artifacts under a configured directory key', async () => {
		// The `directory` key relocates the artifact root; schema and data land under it, not the default.
		writeConfig({ profiles: { staging: { url } }, directory: 'cms' });
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();
		interceptDefaultRecords();

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(0);

		expect(existsSync(join(dir, 'cms', 'default', 'schema', 'metadata.json'))).toBe(true);
		expect(existsSync(join(dir, 'cms', 'default', 'data', 'metadata.json'))).toBe(true);
	});

	it('enforces containment against a configured directory that symlinks outside the project', async () => {
		// Containment is re-checked on whatever `directory` resolves to: a configured root symlinked outside
		// the project must be refused before the fetch, leaving the outside target empty.
		writeConfig({ profiles: { staging: { url } }, directory: 'cms' });
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const outside = world.outsideDir();
		symlinkSync(outside, join(dir, 'cms'));

		expect(await d6s('sync', 'pull', '--from', 'staging')).toBe(1);
		expect(stderr.join('')).toMatch(/outside the project/i);
		expect(readdirSync(outside)).toEqual([]);
	});
});
