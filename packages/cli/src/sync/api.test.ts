import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { CliError } from '../kernel/error.js';
import { applyDiff, fetchDiff, fetchSnapshot } from './api.js';
import type { DiffResult, Snapshot } from './contract.js';

describe('fetchSnapshot', () => {
	const realDispatcher = getGlobalDispatcher();
	const token = 'super-secret-static-token';
	const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token };
	let agent: MockAgent;
	const created: string[] = [];

	function isolateHome(): void {
		const dir = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		created.push(dir);
		vi.stubEnv('HOME', dir);
		vi.stubEnv('USERPROFILE', dir);
	}

	function fullSnapshot(overrides: Record<string, unknown> = {}): Record<string, unknown> {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
			...overrides,
		};
	}

	beforeEach(() => {
		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it('carries the resolved credential on the admin-only snapshot request and returns a parsed snapshot', async () => {
		// /schema/snapshot is admin-only, so the request must present the resolved token;
		// the intercept only matches when the Authorization header is on the wire.
		isolateHome();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: fullSnapshot() }, { headers: { 'content-type': 'application/json' } });

		const snapshot = await fetchSnapshot(credential);

		expect(snapshot.version).toBe(1);
		expect(snapshot.collections[0]?.collection).toBe('articles');
		// Present as [] on the wire; the parse preserves it verbatim (never defaulted) so callers
		// map over the value the server actually sent.
		expect(snapshot.systemFields).toEqual([]);
	});

	it('routes a 401 to an AUTH error so credential failures surface hints, not a stack trace', async () => {
		isolateHome();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET' })
			.reply(
				401,
				{ errors: [{ message: 'nope', extensions: { code: 'INVALID_CREDENTIALS' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(fetchSnapshot(credential)).rejects.toMatchObject({ code: 'AUTH' });
	});

	it('fails at the transport boundary, naming the drifted field, when the snapshot shape breaks', async () => {
		// A 200 that omits a required field is a protocol break; routing the response through
		// the contract parse makes drift fail loud here rather than downstream.
		isolateHome();

		const { collections: _collections, ...withoutCollections } = fullSnapshot();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET' })
			.reply(200, { data: withoutCollections }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchSnapshot(credential).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).detail).toMatch(/collections/i);
	});
});

describe('fetchDiff', () => {
	const realDispatcher = getGlobalDispatcher();
	const token = 'super-secret-static-token';
	const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token };
	let agent: MockAgent;
	const created: string[] = [];

	function isolateHome(): void {
		const dir = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		created.push(dir);
		vi.stubEnv('HOME', dir);
		vi.stubEnv('USERPROFILE', dir);
	}

	function snapshot(): Snapshot {
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

	function diffBody(): Record<string, unknown> {
		return {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [],
			systemFields: [],
			relations: [],
		};
	}

	beforeEach(() => {
		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it('sends the local snapshot unmodified with the mode on the wire, and returns the parsed diff', async () => {
		// The mode must reach the query string: an absent mode silently means destructive `mirror`. And
		// /schema/diff computes against exactly the snapshot the CLI captured, so it must arrive byte-for-byte.
		isolateHome();

		const local = snapshot();
		let sentBody: string | undefined;

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode: 'merge' },
				headers: { authorization: `Bearer ${token}` },
				body(raw: string) {
					sentBody = raw;
					return true;
				},
			})
			.reply(200, { data: { hash: 'abc123', diff: diffBody() } }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchDiff(credential, local, 'merge');

		expect(sentBody && JSON.parse(sentBody)).toEqual(local);
		expect(result?.hash).toBe('abc123');
		expect(result?.diff.collections[0]?.collection).toBe('events');
	});

	it('resolves null on a 204 empty reply, the "no changes" outcome the command keys off', async () => {
		// When the snapshots already match the server answers 204 with no body; that must resolve to null
		// (the diff command's short-circuit), never a failed parse.
		isolateHome();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/diff', method: 'POST', query: { mode: 'mirror' } })
			.reply(204, '');

		await expect(fetchDiff(credential, snapshot(), 'mirror')).resolves.toBeNull();
	});

	it('routes a Directus error to a CliError so a failed diff surfaces a hint, not a stack trace', async () => {
		isolateHome();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/diff', method: 'POST', query: { mode: 'merge' } })
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await fetchDiff(credential, snapshot(), 'merge').catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
	});
});

describe('applyDiff', () => {
	const realDispatcher = getGlobalDispatcher();
	const token = 'super-secret-static-token';
	const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token };
	let agent: MockAgent;
	const created: string[] = [];

	function isolateHome(): void {
		const dir = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		created.push(dir);
		vi.stubEnv('HOME', dir);
		vi.stubEnv('USERPROFILE', dir);
	}

	function diffResult(): DiffResult {
		return {
			hash: 'abc123',
			diff: {
				collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
				fields: [],
				systemFields: [],
				relations: [],
			},
		};
	}

	beforeEach(() => {
		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it('carries the resolved credential and sends the sealed { hash, diff } to /schema/apply unmodified', async () => {
		// The whole safety model is that the exact diff the server sealed reaches /schema/apply
		// byte-faithful — the server re-checks the hash — so the body must deep-equal the DiffResult,
		// hash and diff untouched. The admin-only intercept only matches with the token on the wire.
		isolateHome();

		const result = diffResult();
		let sentBody: string | undefined;

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/schema/apply',
				method: 'POST',
				headers: { authorization: `Bearer ${token}` },
				body(raw: string) {
					sentBody = raw;
					return true;
				},
			})
			.reply(204, '');

		await applyDiff(credential, result);

		expect(sentBody && JSON.parse(sentBody)).toEqual({ hash: result.hash, diff: result.diff });
	});

	it('routes a Directus error to a CliError so a failed apply surfaces a hint, not a stack trace', async () => {
		isolateHome();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/apply', method: 'POST' })
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await applyDiff(credential, diffResult()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
	});
});
