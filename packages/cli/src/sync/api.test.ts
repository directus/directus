import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { CliError } from '../kernel/error.js';
import { fetchSnapshot } from './api.js';

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
		// Absent from the payload; callers map over it, so the parse must default it to [].
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
