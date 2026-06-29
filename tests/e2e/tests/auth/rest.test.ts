import { randomUUID } from 'node:crypto';
import { authentication, createDirectus, createUser, readMe, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';
import { expectJsonResponse, getSetCookies, toCookieHeader } from './mcp-oauth-utils.js';

const api = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const baseUrl = `http://localhost:${port}`;

async function postAuth(path: string, body: Record<string, unknown>, cookie?: string): Promise<Response> {
	return fetch(`${baseUrl}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify(body),
	});
}

async function login(body: Record<string, unknown>): Promise<Response> {
	return postAuth('/auth/login', {
		email: 'admin@example.com',
		password: 'pw',
		...body,
	});
}

test('auth with token', async () => {
	const token = randomUUID();

	const user = await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email: `${randomUUID()}@test.com`,
			password: 'secret',
			token,
		}),
	);

	const auth = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	const me = await auth.request(readMe());

	expect(user.id).toBe(me.id);
});

test('auth with email & password', async () => {
	const email = `${randomUUID()}@test.com`;

	const user = await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email,
			password: 'secret',
		}),
	);

	const auth = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(authentication());

	await auth.login({
		email,
		password: 'secret',
	});

	const me = await auth.request(readMe());

	expect(user.id).toBe(me.id);
});

test('json refresh and logout keep regular Directus refresh tokens working', async () => {
	const loginResponse = await login({});

	const loginBody = (await expectJsonResponse(loginResponse, 200)) as {
		data?: { access_token?: string; refresh_token?: string };
	};

	expect(loginBody.data?.access_token).toEqual(expect.any(String));
	expect(loginBody.data?.refresh_token).toEqual(expect.any(String));

	const refreshResponse = await postAuth('/auth/refresh', { refresh_token: loginBody.data!.refresh_token });

	const refreshBody = (await expectJsonResponse(refreshResponse, 200)) as {
		data?: { access_token?: string; refresh_token?: string };
	};

	expect(refreshBody.data?.access_token).toEqual(expect.any(String));
	expect(refreshBody.data?.refresh_token).toEqual(expect.any(String));
	expect(refreshBody.data?.refresh_token).not.toBe(loginBody.data?.refresh_token);

	const meResponse = await fetch(`${baseUrl}/users/me`, {
		headers: { Authorization: `Bearer ${refreshBody.data!.access_token}` },
	});

	await expectJsonResponse(meResponse, 200);

	const logoutResponse = await postAuth('/auth/logout', { refresh_token: refreshBody.data!.refresh_token });
	expect(logoutResponse.status).toBe(204);

	const afterLogoutRefresh = await postAuth('/auth/refresh', { refresh_token: refreshBody.data!.refresh_token });
	await expectJsonResponse(afterLogoutRefresh, 401);
});

test('cookie refresh and logout keep regular Directus refresh cookies working', async () => {
	const loginResponse = await login({ mode: 'cookie' });

	const loginBody = (await expectJsonResponse(loginResponse, 200)) as {
		data?: { access_token?: string; refresh_token?: string };
	};

	const loginCookie = toCookieHeader(getSetCookies(loginResponse.headers));

	expect(loginBody.data?.access_token).toEqual(expect.any(String));
	expect(loginBody.data?.refresh_token).toBeUndefined();
	expect(loginCookie).toContain('directus_refresh_token=');

	const refreshResponse = await postAuth('/auth/refresh', {}, loginCookie);

	const refreshBody = (await expectJsonResponse(refreshResponse, 200)) as {
		data?: { access_token?: string; refresh_token?: string };
	};

	const refreshCookie = toCookieHeader(getSetCookies(refreshResponse.headers));

	expect(refreshBody.data?.access_token).toEqual(expect.any(String));
	expect(refreshBody.data?.refresh_token).toBeUndefined();
	expect(refreshCookie).toContain('directus_refresh_token=');

	const logoutResponse = await postAuth('/auth/logout', {}, refreshCookie);
	expect(logoutResponse.status).toBe(204);

	const afterLogoutRefresh = await postAuth('/auth/refresh', {}, refreshCookie);
	await expectJsonResponse(afterLogoutRefresh, 401);
});

test('session refresh and logout keep regular Directus session cookies working', async () => {
	const loginResponse = await login({ mode: 'session' });

	const loginBody = (await expectJsonResponse(loginResponse, 200)) as {
		data?: { access_token?: string; refresh_token?: string };
	};

	const loginCookie = toCookieHeader(getSetCookies(loginResponse.headers));

	expect(loginBody.data?.access_token).toBeUndefined();
	expect(loginBody.data?.refresh_token).toBeUndefined();
	expect(loginCookie).toContain('directus_session_token=');

	const refreshResponse = await postAuth('/auth/refresh', { mode: 'session' }, loginCookie);

	const refreshBody = (await expectJsonResponse(refreshResponse, 200)) as {
		data?: { access_token?: string; refresh_token?: string };
	};

	const refreshCookie = toCookieHeader(getSetCookies(refreshResponse.headers));

	expect(refreshBody.data?.access_token).toBeUndefined();
	expect(refreshBody.data?.refresh_token).toBeUndefined();
	expect(refreshCookie).toContain('directus_session_token=');

	await expectJsonResponse(await fetch(`${baseUrl}/users/me`, { headers: { Cookie: refreshCookie } }), 200);

	const logoutResponse = await postAuth('/auth/logout', { mode: 'session' }, refreshCookie);
	expect(logoutResponse.status).toBe(204);

	const afterLogoutMe = await fetch(`${baseUrl}/users/me`, { headers: { Cookie: refreshCookie } });
	await expectJsonResponse(afterLogoutMe, 401);
});
