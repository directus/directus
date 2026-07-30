import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { credentialStorage } from './config/credentials.js';
import {
	fetchCustomPermissionRulesEntitled,
	fetchQueryLimitMax,
	fetchServerVersion,
	fetchTotalCount,
	loginSession,
	pingServer,
	refreshSessionIfNeeded,
	testConnection,
} from './connection.js';
import { redact } from './secret.js';

describe('connection', () => {
	const realDispatcher = getGlobalDispatcher();
	let agent: MockAgent;
	const created: string[] = [];

	function isolateHome(): string {
		const dir = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		created.push(dir);
		vi.stubEnv('HOME', dir);
		vi.stubEnv('USERPROFILE', dir);
		return dir;
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

	it('logs in, persists a rotating session, and reports identity without storing the password', async () => {
		const home = isolateHome();
		const pool = agent.get('https://cms.example.com');

		pool
			.intercept({ path: '/auth/login', method: 'POST' })
			.reply(
				200,
				{ data: { access_token: 'access-token-value', refresh_token: 'refresh-token-value', expires: 900_000 } },
				{ headers: { 'content-type': 'application/json' } },
			);

		pool
			.intercept({ path: /^\/users\/me/, method: 'GET' })
			.reply(
				200,
				{ data: { first_name: 'Ada', last_name: 'L', email: 'ada@example.com', role: { name: 'Admin' } } },
				{ headers: { 'content-type': 'application/json' } },
			);

		pool
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { project: { project_name: 'Demo' } } }, { headers: { 'content-type': 'application/json' } });

		const identity = await loginSession('https://cms.example.com', 'prod', 'ada@example.com', 'pw-login-secret');

		expect(identity).toMatchObject({ user: 'Ada L', role: 'Admin', projectName: 'Demo' });

		const raw = readFileSync(join(home, '.directus', 'credentials.json'), 'utf8');
		expect(JSON.parse(raw)['https://cms.example.com'].prod.refresh_token).toBe('refresh-token-value');
		expect(raw).not.toContain('pw-login-secret');
		expect(redact('got pw-login-secret')).not.toContain('pw-login-secret');
	});

	it('does not leave a background SDK refresh timer in a one-shot CLI login', async () => {
		isolateHome();
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const pool = agent.get('https://cms.example.com');

		pool
			.intercept({ path: '/auth/login', method: 'POST' })
			.reply(
				200,
				{ data: { access_token: 'access-token-value', refresh_token: 'refresh-token-value', expires: 900_000 } },
				{ headers: { 'content-type': 'application/json' } },
			);

		pool
			.intercept({ path: /^\/users\/me/, method: 'GET' })
			.reply(
				200,
				{ data: { first_name: 'Ada', last_name: 'L', email: 'ada@example.com', role: { name: 'Admin' } } },
				{ headers: { 'content-type': 'application/json' } },
			);

		pool
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { project: { project_name: 'Demo' } } }, { headers: { 'content-type': 'application/json' } });

		await loginSession('https://cms.example.com', 'prod', 'ada@example.com', 'pw-login-secret');

		expect(setTimeoutSpy).not.toHaveBeenCalled();
	});

	it('clears a saved login session when identity lookup fails', async () => {
		const home = isolateHome();
		const pool = agent.get('https://cms.example.com');

		pool
			.intercept({ path: '/auth/login', method: 'POST' })
			.reply(
				200,
				{ data: { access_token: 'access-token-value', refresh_token: 'refresh-token-value', expires: 900_000 } },
				{ headers: { 'content-type': 'application/json' } },
			);

		pool
			.intercept({ path: /^\/users\/me/, method: 'GET' })
			.reply(
				500,
				{ errors: [{ message: 'broken', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(
			loginSession('https://cms.example.com', 'prod', 'ada@example.com', 'pw-login-secret'),
		).rejects.toMatchObject({ code: 'HTTP' });

		const raw = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(raw['https://cms.example.com']).toBeUndefined();
	});

	it('maps a failed login through the safe request-error path', async () => {
		isolateHome();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/auth/login', method: 'POST' })
			.reply(
				401,
				{ errors: [{ message: 'nope', extensions: { code: 'INVALID_CREDENTIALS' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(loginSession('https://cms.example.com', 'prod', 'ada@example.com', 'wrong')).rejects.toMatchObject({
			code: 'AUTH',
		});
	});

	it('does not retain a static token in an authentication error', async () => {
		const token = 'super-secret-static-token';

		agent
			.get('https://cms.example.com')
			.intercept({ path: /^\/users\/me/, method: 'GET' })
			.reply(
				401,
				{ errors: [{ message: 'nope', extensions: { code: 'INVALID_CREDENTIALS' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await testConnection({ url: 'https://cms.example.com', token, kind: 'token' }).catch(
			(error: unknown) => error,
		);

		expect(error).toMatchObject({ code: 'AUTH' });
		expect(JSON.stringify(error)).not.toContain(token);
	});

	it('reports a 403 license limit as its real cause instead of an authentication failure', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: /^\/users\/me/, method: 'GET' })
			.reply(
				403,
				{ errors: [{ message: 'flows limit exceeded', extensions: { code: 'LIMIT_EXCEEDED' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(
			testConnection({ url: 'https://cms.example.com', token: 'token', kind: 'token' }),
		).rejects.toMatchObject({
			code: 'HTTP',
			message: 'Target limit exceeded for https://cms.example.com.',
			detail: 'LIMIT_EXCEEDED: flows limit exceeded',
		});
	});

	it('resolves when the instance answers the unauthenticated ping', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/server/ping', method: 'GET' })
			.reply(200, 'pong', { headers: { 'content-type': 'text/plain' } });

		await expect(pingServer('https://cms.example.com')).resolves.toBeUndefined();
	});

	it('maps an unreachable host to a reachability error', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/server/ping', method: 'GET' })
			.replyWithError(new Error('getaddrinfo ENOTFOUND'));

		await expect(pingServer('https://cms.example.com')).rejects.toMatchObject({ code: 'HTTP' });
	});

	function seedSession(url: string, profile: string, expiresAt: number): void {
		credentialStorage(url, profile).set({
			access_token: 'old-access',
			refresh_token: 'refresh-value',
			expires: 900_000,
			expires_at: expiresAt,
		});
	}

	it('leaves a static token untouched — there is nothing to refresh', async () => {
		// No /auth/refresh is registered, so a stray refresh request would throw on the disabled dispatcher;
		// resolving proves the static-token path is a pure no-op.
		await expect(
			refreshSessionIfNeeded({ url: 'https://cms.example.com', token: 'tok', kind: 'token' }),
		).resolves.toBeUndefined();
	});

	it('does not refresh a session whose access token is still valid', async () => {
		// A future expiry means the saved token is fine; refreshing it anyway would rotate tokens on every
		// command for no reason. No /auth/refresh is registered, so a refresh attempt would fail the test.
		isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() + 3_600_000);

		await refreshSessionIfNeeded({ url: 'https://cms.example.com', profileName: 'prod', kind: 'session' });

		expect((await credentialStorage('https://cms.example.com', 'prod').get())?.access_token).toBe('old-access');
	});

	it('refreshes an expired session and persists the rotated tokens for later requests', async () => {
		// The whole point: an expired access token becomes a silent re-auth. After refresh the shared store
		// must hold the new access token so every subsequent request (SDK or raw fetch) reads it.
		isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() - 1_000);

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/auth/refresh', method: 'POST' })
			.reply(
				200,
				{ data: { access_token: 'new-access', refresh_token: 'new-refresh', expires: 900_000 } },
				{ headers: { 'content-type': 'application/json' } },
			);

		await refreshSessionIfNeeded({ url: 'https://cms.example.com', profileName: 'prod', kind: 'session' });

		expect((await credentialStorage('https://cms.example.com', 'prod').get())?.access_token).toBe('new-access');
	});

	it('fails with a re-authenticate hint when the refresh token itself is dead', async () => {
		// A dead refresh token is the one case re-login is unavoidable — surface that clearly, naming the
		// command to run, instead of letting the request fail later with a bare 401.
		isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() - 1_000);

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/auth/refresh', method: 'POST' })
			.reply(
				401,
				{ errors: [{ message: 'nope', extensions: { code: 'INVALID_CREDENTIALS' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await refreshSessionIfNeeded({
			url: 'https://cms.example.com',
			profileName: 'prod',
			kind: 'session',
		}).catch((error: unknown) => error);

		expect(error).toMatchObject({ code: 'AUTH' });
		expect((error as { hint: string }).hint).toContain('profile test prod');
	});

	it('surfaces a non-auth refresh failure as itself, never as an expired session', async () => {
		// A 5xx (or timeout, or unreachable server) during refresh proves nothing about the session, but the
		// blanket "has expired — sign in again" wording sent operators to re-authenticate against a server
		// they could not reach. The real failure must keep its own code and message so the actual fix is visible.
		isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() - 1_000);

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/auth/refresh', method: 'POST' })
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await refreshSessionIfNeeded({
			url: 'https://cms.example.com',
			profileName: 'prod',
			kind: 'session',
		}).catch((error: unknown) => error);

		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as { message: string }).message).not.toContain('expired');
	});

	const token = { url: 'https://cms.example.com', token: 'tok', kind: 'token' } as const;

	it('reads the Directus version from /server/info', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { version: '11.2.0' } }, { headers: { 'content-type': 'application/json' } });

		await expect(fetchServerVersion(token)).resolves.toBe('11.2.0');
	});

	it('returns undefined for the version rather than throwing when /server/info fails', async () => {
		// The version only powers a skew warning, so an unreachable or erroring info endpoint must degrade
		// silently — a broken best-effort read can never take down the command that depends on the real work.
		agent
			.get('https://cms.example.com')
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.replyWithError(new Error('boom'));

		await expect(fetchServerVersion(token)).resolves.toBeUndefined();
	});

	it('reads queryLimit.max from /server/info', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { queryLimit: { max: -1 } } }, { headers: { 'content-type': 'application/json' } });

		await expect(fetchQueryLimitMax(token)).resolves.toBe(-1);
	});

	it('returns undefined for the query limit when /server/info omits it, so paging falls back to probing', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: /^\/server\/info/, method: 'GET' })
			.reply(200, { data: { project: { project_name: 'Demo' } } }, { headers: { 'content-type': 'application/json' } });

		await expect(fetchQueryLimitMax(token)).resolves.toBeUndefined();
	});

	it('reads custom_permission_rules_enabled from /license, preferring override over default', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/license', method: 'GET' })
			.reply(
				200,
				{ data: { entitlements: { custom_permission_rules_enabled: { override: true, default: false } } } },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(fetchCustomPermissionRulesEntitled(token)).resolves.toBe(true);
	});

	it('falls back to the entitlement default when there is no override', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/license', method: 'GET' })
			.reply(
				200,
				{ data: { entitlements: { custom_permission_rules_enabled: { override: null, default: false } } } },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(fetchCustomPermissionRulesEntitled(token)).resolves.toBe(false);
	});

	it('degrades to undefined on a non-admin 403 from /license instead of failing the pull', async () => {
		// /license is admin-only. A non-admin (or any 403) must not error — the entitlement read is purely an
		// enrichment, so the caller falls back to inference and the sync proceeds. This is the graceful path.
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/license', method: 'GET' })
			.reply(
				403,
				{ errors: [{ message: 'nope', extensions: { code: 'FORBIDDEN' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(fetchCustomPermissionRulesEntitled(token)).resolves.toBeUndefined();
	});

	it('degrades the count and entitlement probes to undefined when the credential store is corrupt', async () => {
		// Both probes promise best-effort: they only enrich output (export completeness, entitlement
		// warnings). Their session-token resolution reads the credential store, so a store corrupted
		// mid-command must degrade them to undefined like any other failure — a STATE throw from that read
		// would kill the pull the probe merely decorates.
		const home = isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() + 3_600_000);
		writeFileSync(join(home, '.directus', 'credentials.json'), '{ not valid json');

		const session = { url: 'https://cms.example.com', profileName: 'prod', kind: 'session' } as const;

		await expect(fetchTotalCount(session, '/users')).resolves.toBeUndefined();
		await expect(fetchCustomPermissionRulesEntitled(session)).resolves.toBeUndefined();
	});
});
