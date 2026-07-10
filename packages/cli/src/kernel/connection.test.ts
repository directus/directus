import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeIdentity, loginSession, mapRequestError, pingServer } from './connection.js';
import { redact } from './secret.js';

describe('describeIdentity', () => {
	it('prefers a full name, then email, then a safe placeholder', () => {
		expect(describeIdentity({ first_name: 'Bryant', last_name: 'G', email: 'b@x.com' }, undefined).user).toBe(
			'Bryant G',
		);

		expect(describeIdentity({ email: 'b@x.com' }, undefined).user).toBe('b@x.com');
		expect(describeIdentity({}, undefined).user).toBe('unknown user');
	});

	it('reads the role name from an expanded role or a bare id string', () => {
		expect(describeIdentity({ role: { name: 'Administrator' } }, undefined).role).toBe('Administrator');
		expect(describeIdentity({ role: 'role-uuid' }, undefined).role).toBe('role-uuid');
		expect(describeIdentity({}, undefined).role).toBe('unknown role');
	});

	it('passes the project name through', () => {
		expect(describeIdentity({}, 'My CMS').projectName).toBe('My CMS');
	});
});

// The SDK captures globalThis.fetch at module load, so stubbing fetch is too
// late — MockAgent intercepts underneath it at the undici dispatcher level.
describe('loginSession', () => {
	const realDispatcher = getGlobalDispatcher();
	let agent: MockAgent;
	const created: string[] = [];

	// Isolate HOME so the session lands in a throwaway store, not the developer's
	// real ~/.directus.
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
		vi.unstubAllEnvs();
		for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it('logs in and persists a rotating session — never the password — then reports identity', async () => {
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

		// What persists is the rotating refresh-token session, keyed by profile —
		// the password used to obtain it appears nowhere on disk.
		const raw = readFileSync(join(home, '.directus', 'credentials.json'), 'utf8');
		expect(JSON.parse(raw)['https://cms.example.com'].prod.refresh_token).toBe('refresh-token-value');
		expect(raw).not.toContain('pw-login-secret');

		// The password was registered as a secret before any request could echo it.
		expect(redact('got pw-login-secret')).not.toContain('pw-login-secret');
	});

	it('maps a failed login through the same safe error path as testConnection', async () => {
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
});

describe('pingServer', () => {
	const realDispatcher = getGlobalDispatcher();
	let agent: MockAgent;

	beforeEach(() => {
		agent = new MockAgent();
		agent.disableNetConnect();
		setGlobalDispatcher(agent);
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await agent.close();
	});

	it('resolves when the instance answers the unauthenticated ping', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/server/ping', method: 'GET' })
			.reply(200, 'pong', { headers: { 'content-type': 'text/plain' } });

		await expect(pingServer('https://cms.example.com')).resolves.toBeUndefined();
	});

	it('maps an unreachable host to a reachability error, so add can warn about a typo', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/server/ping', method: 'GET' })
			.replyWithError(new Error('getaddrinfo ENOTFOUND'));

		await expect(pingServer('https://cms.example.com')).rejects.toMatchObject({ code: 'HTTP' });
	});
});

describe('mapRequestError', () => {
	function directusError(status: number, code: string, response: unknown = { status }) {
		return { name: 'RequestError', errors: [{ message: `${code} happened`, extensions: { code } }], response };
	}

	it('maps 401 / auth codes to an AUTH error with a clean message', () => {
		const result = mapRequestError(directusError(401, 'INVALID_CREDENTIALS'), 'https://cms.example.com');

		expect(result.code).toBe('AUTH');
		expect(result.message).toBe('Authentication failed for https://cms.example.com.');
		expect(result.detail).toContain('INVALID_CREDENTIALS');
	});

	it('maps a 403 FORBIDDEN to AUTH', () => {
		expect(mapRequestError(directusError(403, 'FORBIDDEN'), 'https://cms.example.com').code).toBe('AUTH');
	});

	it('maps other statuses to HTTP with the status in the message', () => {
		const result = mapRequestError(directusError(500, 'INTERNAL_SERVER_ERROR'), 'https://cms.example.com');

		expect(result.code).toBe('HTTP');
		expect(result.message).toContain('HTTP 500');
	});

	it('builds detail from error codes only — never the Response, which carries the token', () => {
		// The Response object holds the sent Authorization header; detail must not.
		const withToken = directusError(401, 'INVALID_CREDENTIALS', {
			status: 401,
			headers: { Authorization: 'Bearer super-secret-token-xyz' },
		});

		const result = mapRequestError(withToken, 'https://cms.example.com');

		expect(result.detail).not.toContain('super-secret-token-xyz');
		expect(result.message).not.toContain('super-secret-token-xyz');
	});

	it('maps a transport failure (no Response) to a reachability HTTP error', () => {
		const result = mapRequestError(new Error('fetch failed'), 'https://cms.example.com');

		expect(result.code).toBe('HTTP');
		expect(result.message).toContain('Could not reach');
		expect(result.detail).toBe('fetch failed');
	});
});
