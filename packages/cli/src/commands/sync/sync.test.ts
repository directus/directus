import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../../kernel/run.js';
import { registerSync } from './index.js';

// The owned-file shape written by src/sync/store.ts: `${slug}_${hash}.json`.
const OWNED = /^[a-z0-9-]*_[0-9a-f]{8}\.json$/;

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
			ok: true,
			source: url,
			dir: 'directus/default/schema',
			collections: 1,
			fields: 1,
			systemFields: 0,
			relations: 0,
			files: 2,
			removed: [],
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
});
