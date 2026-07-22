import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
	mockDefaultRecords,
	mockDiff,
	mockImport,
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

// The per-test world (dirs, agent, env isolation, output capture) lives in the harness; the module-scope
// slots mirror it so every call site below stays argument-free. Tests run sequentially within a file, so
// the shared slots never overlap.
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

// Thin binders over the shared helpers, closing over the module-scope dir/agent so every call site stays
// argument-free exactly as it read before the hoist.
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

// A target record fetch during reconcile is the same whole-set list request a pull makes.
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

// Drive the whole path through the real dispatcher against a throwaway project dir (like
// profile.test.ts) while pinning the network with undici and isolating HOME/env (like
// connection.test.ts), so a pull exercises parse → profile → credential → fetch → files
// with nothing borrowed from the developer's real machine.
describe('sync pull', () => {
	// A full snapshot spanning two collections, so a later scoped pull of one can be shown to leave the
	// other's committed artifact untouched.
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

	// A partial (version 2) response carrying only articles, changed — what the server returns for an
	// include-scoped pull of articles.
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

	// This suite serves the plain full snapshot; other suites pass their own body to mockSnapshot.
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

		const line = stderr.join('');
		expect(line).toMatch(/1 collection/);
		expect(line).toContain('directus/default/schema');
	});

	it('emits a machine payload of ok:true, the snapshot counts, and the default data export on --json', async () => {
		// CI consumes this shape to decide whether a pull produced changes. `data` is now always an object
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
		expect(stderr.join('')).toContain('(scoped to: articles)');
	});

	it('preserves out-of-scope siblings end to end when pulling a single collection', async () => {
		// Pulling one collection must never destroy the committed schema around it (the spec's
		// incremental-transfer core): a full pull writes articles + authors, then a scoped pull of only
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

		// The sibling is untouched: identical bytes and still listed in the ownership manifest.
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

// Every pull now snapshots schema AND exports config resources by default (undici pins the wire, HOME/env
// isolated, CI forces token-only resolution). A record endpoint is registered only when the pull is
// expected to hit it, so the disabled dispatcher turns any stray request into a throw: an unregistered
// endpoint proves a resource was NOT exported, an unconsumed one that it was not skipped.
describe('sync pull resources and data', () => {
	let dataDir: string;

	beforeEach(() => {
		dataDir = join(dir, 'directus', 'default', 'data');
	});

	// A full schema whose articles collection carries a primary key, so a --content export can key on it.
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

	// This suite's snapshot carries a primary key so a --content export can key on it; the shared list and
	// default-record binders serve the rest.
	function interceptSnapshot(): void {
		mockSnapshot(agent, schemaBody());
	}

	// The collection names of every data artifact on disk, sorted — the exported set the assertions read.
	function exportedCollections(): string[] {
		return readdirSync(dataDir)
			.filter((name) => OWNED.test(name))
			.map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')).collection)
			.sort();
	}

	it('exports every default resource but never users on a bare pull', async () => {
		// Spec Q8: a bare pull ships the whole config graph EXCEPT users (selectable-but-off). /users is not
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
		// --resources roles must drag in policies and their access/permissions children (closure on).
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

	it('drops a resource and any child that only rode in through it under --exclude-resources', async () => {
		// Excluding flows removes flows AND operations (operations only rides via flows); everything else in
		// the default set stays. /flows and /operations are left unregistered to prove they are skipped.
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
		// Mutual exclusivity is a client-side USAGE contract; passing both never reaches the wire.
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
		// The non-sensitive columns survive, so the export is not simply empty.
		expect(userBytes).toContain('editor@example.com');
	});

	it('writes nothing at all when a data fetch fails — no mixed generations', async () => {
		// The commit point is after every fetch: a pull that dies mid-fetch must leave the committed tree
		// exactly as it was — never a fresh schema beside stale data, which a later mirror push would treat
		// as the desired state.
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
		// With users selected the FK is satisfied, so no access row is filtered.
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
		// --content names a user collection, exported from /items/<name> keyed on the pulled schema's PK, and
		// listed under the report's top-level `content`.
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
		// A resource-graph name is not content; the error must route the operator to --resources. It fails
		// after the schema write but before any record fetch, so no record endpoint is registered.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--content', 'roles')).toBe(1);
		expect(stderr.join('')).toContain('--resources');
	});

	it('refuses a project that is not declared in config', async () => {
		// Any project but `default` must be declared; a typo fails CONFIG before the network.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		expect(await d6s('sync', 'pull', '--from', 'staging', '--project', 'prod')).toBe(1);
		expect(stderr.join('')).toContain('Unknown project');
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

// Seed local artifacts directly with writeSnapshotFiles rather than running pull first, so the diff
// path is exercised in isolation from pull's network fetch. Same isolation discipline as `sync pull`:
// undici pins the wire, HOME/env are stubbed, and CI forces resolution to read only the token var.
describe('sync diff', () => {
	let schemaDir: string;

	beforeEach(() => {
		schemaDir = join(dir, 'directus', 'default', 'schema');
	});

	function partialSnapshot(): Snapshot {
		return { ...fullSnapshot(), version: 2 };
	}

	// One added collection, one modified field (path meta.note), one deleted field: the three change
	// kinds the summary must count, carrying the loud DELETE and (meta.note) tokens the human line shows.
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
				skipped: true,
			},
		});
	});

	it('diffs a partial snapshot in mirror mode by sending it to the wire', async () => {
		// Scoped deletions are the spec's partial-mirror purpose — a partial mirror diff deletes
		// fields/relations within scope but never collections — and the artifacts now carry an honest SET
		// version, so the CLI no longer refuses it. mode=mirror must reach the wire; refusing it was a stopgap.
		seedConfig();
		writeSnapshotFiles(schemaDir, partialSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', null);

		expect(await d6s('sync', 'diff', '--to', 'staging', '--mode', 'mirror')).toBe(0);
		expect(stderr.join('')).toContain('staging matches the local snapshot — nothing to do.');
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

// Push is the first mutating command, so the discipline stays the same (undici pins the wire, HOME/env
// isolated, CI forces token-only resolution) and the gate semantics are exercised end to end: --yes
// applies, deletions demand --allow-deletes, and the sealed { hash, diff } must reach /schema/apply
// unmodified. The apply intercept is registered only when a call is expected — the disabled dispatcher
// turns any unexpected apply request into a throw, so its absence proves no apply happened.
describe('sync push', () => {
	let schemaDir: string;

	beforeEach(() => {
		schemaDir = join(dir, 'directus', 'default', 'schema');
	});

	// One added collection plus one modified field, no deletions: exercises the plain apply path.
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

	// A single field deletion: the change kind the deletion gates key off.
	function mirrorDiffBody(): Record<string, unknown> {
		return {
			collections: [],
			fields: [{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] }],
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

	it('prints the resolved target on the human channel before the diff summary so a misbound profile is visible', async () => {
		// The misbinding guard (S48): a profile NAMED staging pointing at prod's URL must be visible
		// before anything mutates, so the resolution line lands on stderr ahead of the change summary.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', mergeDiffBody());
		interceptApply();

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(0);

		const err = stderr.join('');
		const resolutionAt = err.indexOf(`target: staging — ${url}`);
		const summaryAt = err.indexOf('to push to');
		expect(resolutionAt).toBeGreaterThanOrEqual(0);
		expect(summaryAt).toBeGreaterThan(resolutionAt);
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
			added: 1,
			modified: 1,
			deleted: 0,
			hash: 'h1',
			// No data dir was seeded, so the data phase is skipped and its block carries null-ish fields —
			// always present so a consumer never has to guess whether data ran.
			data: { mode: 'merge', source: null, collections: null, skipped: true },
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
			added: 0,
			modified: 0,
			deleted: 0,
			hash: null,
			data: { mode: 'merge', source: null, collections: null, skipped: true },
		});
	});

	it('refuses mirror in CI without --allow-deletes, before any apply, naming the consent flag', async () => {
		// The updated truth table: mirror can delete BOTH schema and data rows absent from the import set,
		// and CI skips the dry-run, so the data deletions are unknowable — mirror itself requires
		// --allow-deletes in CI. --yes never covers deletions. The refusal must precede any apply request.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', mirrorDiffBody());

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toMatch(/refusing mirror/i);
		expect(err).toContain('--allow-deletes');
	});

	it('applies deletions when --allow-deletes accompanies --yes', async () => {
		// --allow-deletes is the CI consent for deletions; with it the mirror diff applies.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', mirrorDiffBody());

		let applied: unknown;

		interceptApply((body) => {
			applied = body;
		});

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes', '--allow-deletes')).toBe(0);

		expect(applied).toEqual({ hash: 'h1', diff: mirrorDiffBody() });
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
});

// The data phase end to end: schema diff/apply plus a multipart /utils/import whose body must decode to
// the REMAPPED batch, the ID map written from reconcile matches + the import response, and the mode gates
// exercised against real requests. Same isolation as the schema-only push suite (undici pins the wire,
// HOME/env stubbed, CI forces token-only resolution and non-interactive gates). An endpoint is registered
// only when a call is expected, so a stray request throws on the disabled dispatcher.
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

	// A schema diff with one added collection: enough that the schema phase applies, so the combined flow
	// (apply then import) is exercised.
	function schemaChangesBody(): Record<string, unknown> {
		return {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [],
			systemFields: [],
			relations: [],
		};
	}

	// Roles matched by natural key (name), an access row referencing that role (FK remap), and a content
	// collection passed through untouched: the three remap behaviors in one batch.
	function fullFixture(): DataCollection[] {
		return [
			// icon differs from the target row so the matched role still rides as a genuine update
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor', icon: 'edit' }] },
			{
				collection: 'directus_access',
				primaryKey: 'id',
				records: [{ id: 'sa1', role: 'sr1', policy: null, user: null }],
			},
			{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] },
		];
	}

	// The import response for the full fixture: roles matched (updated in place), access inserted and
	// remapped sa1→na1, articles inserted. Push must fold every one of these into the committed map.
	function fullImportResult(): Record<string, unknown> {
		return {
			applied: true,
			mode: 'merge',
			collections: {
				directus_access: { existing: [], new: ['na1'], deleted: [], mapped: { sa1: 'na1' } },
				directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} },
				articles: { existing: [], new: [1], deleted: [], mapped: {} },
			},
		};
	}

	function seedData(collections: DataCollection[]): void {
		writeDataFiles(dataDir, collections, source);
	}

	function readIdMapFile(): Record<string, unknown> {
		return JSON.parse(readFileSync(idMapPath, 'utf8'));
	}

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
			{ collection: 'articles', items: [{ id: 1, title: 'Hello' }] },
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

	it('carries dangerouslyAllowDelete on the import when mirror runs with --allow-deletes', async () => {
		// mirror maps to a merge import plus dangerouslyAllowDelete (the server has no wire "mirror"); the
		// exact query match proves the destructive flag rode along only because --allow-deletes consented.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', schemaChangesBody());
		interceptApply();
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

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

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes', '--allow-deletes')).toBe(0);
	});

	it('refuses mirror in CI without --allow-deletes before any apply or import, even with data present', async () => {
		// The updated gate: mirror can delete schema AND data rows absent from the import set, unknowable in
		// CI without a dry-run, so it is refused outright. Only the diff is registered — a reached apply or
		// import would throw on the disabled dispatcher, proving neither happened.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', schemaChangesBody());

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes')).toBe(1);
		expect(stderr.join('')).toMatch(/refusing mirror/i);
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
		// The clean state must be reachable: when every committed record is proven byte-identical on the
		// target, the batch empties and push must say so and stop — not upsert every row again (the server
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

	it('emits the PushReport data block with the source and verbatim response collections on --json', async () => {
		// CI reads this shape: the data block is always present, carrying the mode, the source URL, and the
		// server's per-collection response verbatim, alongside the project and schema fields.
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
				collections: fullImportResult()['collections'],
			},
		});
	});

	it('reports changes:true for a data-only push that imported rows', async () => {
		// A push with a clean schema but a real import mutated the target; `changes` is the overall answer
		// (schema OR data), so it must not read false just because the schema half was a no-op. `applied`
		// stays schema-scoped, mirroring the added/modified/deleted counts beside it.
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

		expect(payload).toMatchObject({ kind: 'PushReport', ok: true, applied: false, changes: true, hash: null });
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

// diff previews the data phase (spec Q15): schema diff + a data dry-run summary, and it is READ-ONLY — it
// must never write the id map and never prompt. Same isolation as the push-with-data suite (undici pins
// the wire, HOME/env stubbed, CI forces token-only, non-interactive). An endpoint is registered only when
// a call is expected; a stray request throws on the disabled dispatcher. The invariant every test guards:
// id_map.json is absent afterwards, because previewData applies matches in memory only.
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
		// The core of the preview: an unambiguous match (role Editor sr1→tr1) is applied to the batch in
		// memory so the dry-run is truthful, the plan renders per collection, and — the invariant — the id
		// map is never written even though a match was found.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			// icon differs from the target row so the matched role still rides as a genuine update
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor', icon: 'edit' }] },
			{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] },
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);

		let sentForm: FormData | undefined;

		interceptImport(
			{ mode: 'merge', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: {
						directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} },
						articles: { existing: [], new: [1], deleted: [], mapped: {} },
					},
				},
			},
			200,
			(form) => {
				sentForm = form;
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		// The dry-run received the batch remapped into target space (role sr1→tr1), so the preview is honest.
		expect(await decodeBatch(sentForm)).toEqual([
			{ collection: 'directus_roles', items: [{ id: 'tr1', name: 'Editor', icon: 'edit' }] },
			{ collection: 'articles', items: [{ id: 1, title: 'Hello' }] },
		]);

		const out = stdout.join('');
		expect(out).toContain('articles');
		expect(out).toContain('+1 new');
		expect(out).toContain('directus_roles');

		// THE invariant of this slice: diff never wrote the id map.
		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports the reconcile counts and the dry-run response verbatim on --json, still writing nothing', async () => {
		// CI reads the data block: the mode, the source URL, the server's per-collection dry-run response
		// verbatim, and the reconcile tally (one matched, none pending). The id map stays absent.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] },
			{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] },
		]);

		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		const collections = {
			directus_roles: { existing: ['tr1'], new: [], deleted: [], mapped: {} },
			articles: { existing: [], new: [1], deleted: [], mapped: {} },
		};

		interceptDiff('merge', null);
		interceptTarget('/roles', [{ id: 'tr1', name: 'Editor' }]);
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
				unmatched: 0,
				skipped: false,
			},
		});

		expect(existsSync(idMapPath)).toBe(false);
	});

	it('reports an ambiguity as a note rather than resolving it, and never prompts or writes', async () => {
		// Two target roles named Editor make sr1 ambiguous. diff must REPORT it (the note names the pending
		// count and how many are ambiguous) rather than stop to ask — CI never prompts — and must leave the
		// source unremapped and the id map unwritten.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		interceptTarget('/roles', [
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		interceptImport(
			{ mode: 'merge', dryRun: 'true' },
			{
				data: {
					applied: false,
					mode: 'merge',
					collections: { directus_roles: { existing: [], new: ['sr1'], deleted: [], mapped: {} } },
				},
			},
		);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);

		const err = stderr.join('');
		expect(err).toContain('have no target match yet');
		expect(err).toContain('1 ambiguous');

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

	it('keeps the original no-op copy when there is no committed data to check', async () => {
		// A schema-only checkout: no data directory, so the preview is skipped and the line stays exactly the
		// pre-data copy — data phrasing must not leak in when nothing was checked.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('merge', null);

		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);
		expect(stderr.join('')).toContain('staging matches the local snapshot — nothing to do.');
	});
});

// The bare `d6s sync` wiring: commander must fire the parent's wizard action only when no subcommand is
// given, so `sync` alone runs the wizard (which refuses without a terminal here — CI is forced), `sync
// pull` still routes to the pull subcommand, and `sync --help` still prints help. No network is touched;
// the wizard's non-interactive guard trips before any config or wire work.
describe('sync bare wizard wiring', () => {
	it('runs the wizard for bare `sync` and refuses without a terminal, pointing at the subcommands', async () => {
		expect(await d6s('sync')).toBe(1);

		const err = stderr.join('');
		expect(err).toMatch(/needs a terminal/i);
		expect(err).toMatch(/sync pull/i);
	});

	it('does NOT fire the wizard when a subcommand is given (sync pull still routes to pull)', async () => {
		// A subcommand present means the parent action must not fire: `sync pull` with no --from is pull's own
		// required-option error, not the wizard's terminal refusal.
		expect(await d6s('sync', 'pull')).toBe(1);

		const err = stderr.join('');
		expect(err).not.toMatch(/needs a terminal/i);
		expect(err).toMatch(/--from/);
	});

	it('still prints help for `sync --help`', async () => {
		expect(await d6s('sync', '--help')).toBe(0);
		expect(stdout.join('')).toMatch(/Sync schema and configuration/i);
	});
});
