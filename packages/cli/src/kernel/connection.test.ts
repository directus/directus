import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
import type { CliError } from './error.js';
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

	it('returns the rotating session and the identity it proved, storing neither it nor the password', async () => {
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

		const { identity, session } = await loginSession('https://cms.example.com', 'ada@example.com', 'pw-login-secret');

		expect(identity).toMatchObject({ user: 'Ada L', role: 'Admin', projectName: 'Demo' });
		expect(session.refresh_token).toBe('refresh-token-value');
		expect(existsSync(join(home, '.directus', 'credentials.json'))).toBe(false);
		expect(JSON.stringify(session)).not.toContain('pw-login-secret');
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

		await loginSession('https://cms.example.com', 'ada@example.com', 'pw-login-secret');

		expect(setTimeoutSpy).not.toHaveBeenCalled();
	});

	it('never persists a session it could not verify, leaving an existing one intact', async () => {
		const home = isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() + 3_600_000);
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

		await expect(loginSession('https://cms.example.com', 'ada@example.com', 'pw-login-secret')).rejects.toMatchObject({
			code: 'HTTP',
		});

		const raw = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(raw['https://cms.example.com'].prod.access_token).toBe('old-access');
		expect(raw['https://cms.example.com'].prod.refresh_token).toBe('refresh-value');
	});

	it('redacts a freshly issued session token echoed by a failing identify', async () => {
		isolateHome();
		const issued = 'access-token-echoed-by-server';
		const pool = agent.get('https://cms.example.com');

		pool
			.intercept({ path: '/auth/login', method: 'POST' })
			.reply(
				200,
				{ data: { access_token: issued, refresh_token: 'refresh-token-value', expires: 900_000 } },
				{ headers: { 'content-type': 'application/json' } },
			);

		pool
			.intercept({ path: /^\/users\/me/, method: 'GET' })
			.reply(
				403,
				{ errors: [{ message: `Invalid token "${issued}" for this request.`, extensions: { code: 'FORBIDDEN' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await loginSession('https://cms.example.com', 'ada@example.com', 'pw-login-secret').then(
			() => undefined,
			(caught: unknown) => caught as CliError,
		);

		expect(error?.detail).toContain(issued);
		expect(redact(error?.detail ?? '')).not.toContain(issued);
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

		await expect(loginSession('https://cms.example.com', 'ada@example.com', 'wrong')).rejects.toMatchObject({
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
			message: 'Instance limit exceeded for https://cms.example.com.',
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
		await expect(
			refreshSessionIfNeeded({ url: 'https://cms.example.com', token: 'tok', kind: 'token' }),
		).resolves.toBeUndefined();
	});

	it('does not refresh a session whose access token is still valid', async () => {
		isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() + 3_600_000);

		await refreshSessionIfNeeded({ url: 'https://cms.example.com', profileName: 'prod', kind: 'session' });

		expect((await credentialStorage('https://cms.example.com', 'prod').get())?.access_token).toBe('old-access');
	});

	it('refreshes an expired session and persists the rotated tokens for later requests', async () => {
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
		expect((error as { hint: string }).hint).toContain('profile test-connection prod');
	});

	it('surfaces a non-auth refresh failure as itself, never as an expired session', async () => {
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
		const home = isolateHome();
		seedSession('https://cms.example.com', 'prod', Date.now() + 3_600_000);
		writeFileSync(join(home, '.directus', 'credentials.json'), '{ not valid json');

		const session = { url: 'https://cms.example.com', profileName: 'prod', kind: 'session' } as const;

		await expect(fetchTotalCount(session, '/users')).resolves.toBeUndefined();
		await expect(fetchCustomPermissionRulesEntitled(session)).resolves.toBeUndefined();
	});
});
