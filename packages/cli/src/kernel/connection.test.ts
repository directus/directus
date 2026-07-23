import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginSession, pingServer, testConnection } from './connection.js';
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
});
