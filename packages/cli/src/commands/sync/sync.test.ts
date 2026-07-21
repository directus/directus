import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../../kernel/run.js';
import type { Snapshot } from '../../sync/contract.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import { registerSync } from './index.js';

// The owned-file shape written by src/sync/store.ts: `${slug}_${hash}.json`.
const OWNED = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

// Drive the whole path through the real dispatcher against a throwaway project dir (like
// profile.test.ts) while pinning the network with undici and isolating HOME/env (like
// connection.test.ts), so a pull exercises parse → profile → credential → fetch → files
// with nothing borrowed from the developer's real machine.
describe('sync pull', () => {
	const realDispatcher = getGlobalDispatcher();
	const url = 'https://cms.example.com';
	const token = 'super-secret-static-token';
	let agent: MockAgent;
	let dir: string;
	let home: string;
	let outside: string | undefined;
	let stdout: string[];
	let stderr: string[];

	function fullSnapshot(): Record<string, unknown> {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};
	}

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

	// The owned artifact whose authoritative `collection` key names the collection — found by content,
	// not filename, so a test never hard-codes the hash the store derives.
	function ownedFileFor(schemaDir: string, collection: string): string {
		for (const name of readdirSync(schemaDir).filter((entry) => OWNED.test(entry))) {
			if (JSON.parse(readFileSync(join(schemaDir, name), 'utf8')).collection === collection) return name;
		}

		throw new Error(`no owned file for ${collection}`);
	}

	function seedConfig(): void {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url } } }));
	}

	// The snapshot endpoint is admin-only, so the intercept only matches when the resolved
	// token is on the wire — a broken credential path never reaches this reply.
	function interceptSnapshot(): void {
		agent
			.get(url)
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: fullSnapshot() }, { headers: { 'content-type': 'application/json' } });
	}

	function d6s(...argv: string[]): Promise<number> {
		return run(argv, { registerCommands: [registerSync], cwd: dir });
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-sync-'));
		home = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		outside = undefined;
		stdout = [];
		stderr = [];

		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);

		// Isolate HOME and force CI so resolution reads only DIRECTUS_STAGING_TOKEN — never the
		// developer's saved store — and behaves the same here as in a pipeline. Default the token
		// to absent; the tests that need it opt in.
		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', 'true');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');

		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout.push(String(chunk));
			return true;
		});

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
		if (outside !== undefined) rmSync(outside, { recursive: true, force: true });
	});

	it('writes the source schema as committable files anchored to the config directory', async () => {
		// Proves the full path lands deterministic files under directus/default/schema and that
		// the human line names the count and destination the operator will commit.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

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

	it('emits a machine payload of ok:true and the snapshot counts on --json', async () => {
		// CI consumes this exact shape to decide whether a pull produced changes.
		seedConfig();
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);
		interceptSnapshot();

		expect(await d6s('sync', 'pull', '--from', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'PullReport',
			formatVersion: 1,
			ok: true,
			source: url,
			profile: 'staging',
			dir: 'directus/default/schema',
			collections: 1,
			fields: 1,
			systemFields: 0,
			relations: 0,
			files: 2,
			removed: [],
			scope: null,
		});
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

		outside = mkdtempSync(join(tmpdir(), 'd6s-outside-'));
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

		outside = mkdtempSync(join(tmpdir(), 'd6s-outside-'));
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

// Seed local artifacts directly with writeSnapshotFiles rather than running pull first, so the diff
// path is exercised in isolation from pull's network fetch. Same isolation discipline as `sync pull`:
// undici pins the wire, HOME/env are stubbed, and CI forces resolution to read only the token var.
describe('sync diff', () => {
	const realDispatcher = getGlobalDispatcher();
	const url = 'https://cms.example.com';
	const token = 'super-secret-static-token';
	let agent: MockAgent;
	let dir: string;
	let schemaDir: string;
	let home: string;
	let stdout: string[];
	let stderr: string[];

	function fullSnapshot(): Snapshot {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};
	}

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

	function seedConfig(): void {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url } } }));
	}

	// The diff endpoint is admin-only and mode-bearing, so the intercept only matches when the resolved
	// token and mode=merge are on the wire; `capture` records the request body for the fidelity check.
	function interceptDiff(capture?: (body: unknown) => void): void {
		agent
			.get(url)
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode: 'merge' },
				headers: { authorization: `Bearer ${token}` },
				body(raw: string) {
					capture?.(JSON.parse(raw));
					return true;
				},
			})
			.reply(200, { data: { hash: 'h1', diff: diffBody() } }, { headers: { 'content-type': 'application/json' } });
	}

	function interceptNoChanges(): void {
		agent
			.get(url)
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode: 'merge' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(204, '');
	}

	function d6s(...argv: string[]): Promise<number> {
		return run(argv, { registerCommands: registerSync, cwd: dir });
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-sync-'));
		schemaDir = join(dir, 'directus', 'default', 'schema');
		home = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		stdout = [];
		stderr = [];

		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);

		// Isolate HOME and force CI so resolution reads only DIRECTUS_STAGING_TOKEN, and default the
		// token absent; the tests that reach the wire opt in.
		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', 'true');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');

		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout.push(String(chunk));
			return true;
		});

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it('sends the seeded snapshot to /schema/diff byte-for-byte and renders the change summary', async () => {
		// The whole git workflow rests on the diff computing against exactly what pull wrote, so the
		// request body must deep-equal the seeded snapshot — the file→wire round trip, unmodified.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		let sent: unknown;

		interceptDiff((body) => {
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
		interceptDiff();

		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			mode: 'merge',
			changes: true,
			added: 1,
			modified: 1,
			deleted: 1,
			hash: 'h1',
		});
	});

	it('reports no changes on a 204 and keys the machine shape off changes:false, hash:null', async () => {
		// CI keys off this exact "nothing to push" shape, so the counts collapse to zero and hash is null.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptNoChanges();
		expect(await d6s('sync', 'diff', '--to', 'staging')).toBe(0);
		expect(stderr.join('')).toContain('staging matches the local snapshot — nothing to do.');

		interceptNoChanges();
		expect(await d6s('sync', 'diff', '--to', 'staging', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			mode: 'merge',
			changes: false,
			added: 0,
			modified: 0,
			deleted: 0,
			hash: null,
		});
	});

	it('diffs a partial snapshot in mirror mode by sending it to the wire', async () => {
		// Scoped deletions are the spec's partial-mirror purpose — a partial mirror diff deletes
		// fields/relations within scope but never collections — and the artifacts now carry an honest SET
		// version, so the CLI no longer refuses it. mode=mirror must reach the wire; refusing it was a stopgap.
		seedConfig();
		writeSnapshotFiles(schemaDir, partialSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		agent
			.get(url)
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode: 'mirror' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(204, '');

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
	const realDispatcher = getGlobalDispatcher();
	const url = 'https://cms.example.com';
	const token = 'super-secret-static-token';
	let agent: MockAgent;
	let dir: string;
	let schemaDir: string;
	let home: string;
	let stdout: string[];
	let stderr: string[];

	function fullSnapshot(): Snapshot {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};
	}

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

	function seedConfig(): void {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url } } }));
	}

	function interceptDiff(mode: 'merge' | 'mirror', body: Record<string, unknown>): void {
		agent
			.get(url)
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: { hash: 'h1', diff: body } }, { headers: { 'content-type': 'application/json' } });
	}

	function interceptDiffNoChanges(mode: 'merge' | 'mirror'): void {
		agent
			.get(url)
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(204, '');
	}

	// The apply endpoint is admin-only; the intercept only matches with the token on the wire, and
	// `capture` records the body so the seal-fidelity check can compare it to the diff that was fetched.
	function interceptApply(capture?: (body: unknown) => void): void {
		agent
			.get(url)
			.intercept({
				path: '/schema/apply',
				method: 'POST',
				headers: { authorization: `Bearer ${token}` },
				body(raw: string) {
					capture?.(JSON.parse(raw));
					return true;
				},
			})
			.reply(204, '');
	}

	// The server's real hash-mismatch reply (see api validate-diff.ts): 400 INVALID_PAYLOAD whose
	// message names the hash. mapRequestError carries that into detail, which push keys the re-run hint off.
	function interceptApplyHashMismatch(): void {
		agent
			.get(url)
			.intercept({ path: '/schema/apply', method: 'POST' })
			.reply(
				400,
				{
					errors: [
						{
							message:
								"Provided hash does not match the current instance's schema hash, indicating the schema has changed after this diff was generated. Please generate a new diff and try again",
							extensions: { code: 'INVALID_PAYLOAD' },
						},
					],
				},
				{ headers: { 'content-type': 'application/json' } },
			);
	}

	function d6s(...argv: string[]): Promise<number> {
		return run(argv, { registerCommands: registerSync, cwd: dir });
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-sync-'));
		schemaDir = join(dir, 'directus', 'default', 'schema');
		home = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		stdout = [];
		stderr = [];

		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);

		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', 'true');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');

		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout.push(String(chunk));
			return true;
		});

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

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
			mode: 'merge',
			applied: true,
			changes: true,
			added: 1,
			modified: 1,
			deleted: 0,
			hash: 'h1',
		});
	});

	it('reports applied:false on a no-change diff and never calls apply', async () => {
		// A 204 diff is "nothing to push": the command must exit 0 with applied:false and issue no apply
		// request at all. No apply intercept is registered, so the disabled dispatcher would throw on one.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiffNoChanges('merge');

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes', '--json')).toBe(0);

		expect(JSON.parse(stdout.join(''))).toEqual({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: 'staging',
			mode: 'merge',
			applied: false,
			changes: false,
			added: 0,
			modified: 0,
			deleted: 0,
			hash: null,
		});
	});

	it('refuses deletions under --yes alone, naming --allow-deletes, and never applies', async () => {
		// The invariant: --yes must NEVER authorize deletions. A mirror diff carrying a deletion under
		// --yes without --allow-deletes must fail before any apply request, and the message must route the
		// CI operator to --allow-deletes. No apply intercept — a stray apply would throw on the disabled net.
		seedConfig();
		writeSnapshotFiles(schemaDir, fullSnapshot());
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		interceptDiff('mirror', mirrorDiffBody());

		expect(await d6s('sync', 'push', '--to', 'staging', '--mode', 'mirror', '--yes')).toBe(1);

		const err = stderr.join('');
		expect(err).toContain('This push deletes 1 item.');
		expect(err).toContain('--yes does not cover deletions');
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
		interceptApplyHashMismatch();

		expect(await d6s('sync', 'push', '--to', 'staging', '--yes')).toBe(1);
		expect(stderr.join('')).toMatch(/re-run d6s sync push/i);
	});
});
