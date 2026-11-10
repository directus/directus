import { randomUUID } from 'node:crypto';
import { authentication, createDirectus, createUser, graphql, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

test('auth with email & password', async () => {
	const email = `${randomUUID()}@test.com`;

	await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email,
			password: 'secret',
		}),
	);

	const auth = createDirectus(`http://localhost:${port}`).with(graphql()).with(authentication());

	const result = await auth.query(
		`
mutation {
    auth_login(email: "${email}", password: "secret") {
        access_token
        refresh_token
    }
}
`,
		{},
		'system',
	);

	expect(result).toEqual({
		auth_login: {
			access_token: expect.any(String),
			refresh_token: expect.any(String),
		},
	});
});

const baseUrl = `http://localhost:${port}`;

/** Posts a system GraphQL operation directly, so cookies and raw errors stay reachable. */
async function systemGraphql(query: string, cookie?: string) {
	const response = await fetch(`${baseUrl}/graphql/system`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
		body: JSON.stringify({ query }),
	});

	return { response, body: (await response.json()) as any };
}

const LOGIN_FAILURES = [
	{
		description: 'the password is wrong',
		args: `email: "admin@example.com", password: "not-the-password"`,
		message: 'Invalid user credentials.',
		code: 'INVALID_CREDENTIALS',
	},
	{
		description: 'the email belongs to nobody',
		args: `email: "nobody@example.com", password: "pw"`,
		message: 'Invalid user credentials.',
		code: 'INVALID_CREDENTIALS',
	},
	{
		// GraphQL reports a malformed email the same way as a wrong one, unlike REST
		description: 'the email is not an email',
		args: `email: "invalidEmail", password: "pw"`,
		message: 'Invalid user credentials.',
		code: 'INVALID_CREDENTIALS',
	},
	{
		description: 'no password is given',
		args: `email: "admin@example.com"`,
		message: 'GraphQL validation error.',
		code: 'GRAPHQL_VALIDATION',
	},
];

for (const { description, args, message, code } of LOGIN_FAILURES) {
	test(`auth_login is refused when ${description}`, async () => {
		const { body } = await systemGraphql(`mutation { auth_login(${args}) { access_token } }`);

		expect(body).toMatchObject({ errors: [{ message, extensions: { code } }] });
	});
}

test('auth_refresh exchanges a refresh token for a new one', async () => {
	const { body: login } = await systemGraphql(
		`mutation { auth_login(email: "admin@example.com", password: "pw") { refresh_token } }`,
	);

	const refreshToken = login.data.auth_login.refresh_token;

	const { body: refreshed } = await systemGraphql(
		`mutation { auth_refresh(refresh_token: "${refreshToken}") { access_token expires refresh_token } }`,
	);

	expect(refreshed.data.auth_refresh).toMatchObject({
		access_token: expect.any(String),
		expires: expect.any(String),
		refresh_token: expect.any(String),
	});

	expect(refreshed.data.auth_refresh.refresh_token).not.toBe(refreshToken);
});

for (const mode of ['cookie', 'session'] as const) {
	test(`auth_refresh in ${mode} mode round trips through the cookie`, async () => {
		const { response: loginResponse } = await systemGraphql(
			`mutation { auth_login(email: "admin@example.com", password: "pw", mode: ${mode}) { expires } }`,
		);

		const cookie = loginResponse.headers
			.getSetCookie()
			.map((entry) => entry.split(';')[0])
			.join('; ');

		expect(cookie).toContain(mode === 'cookie' ? 'directus_refresh_token=' : 'directus_session_token=');

		const { response, body } = await systemGraphql(
			`mutation { auth_refresh(mode: ${mode}) { ${mode === 'cookie' ? 'access_token ' : ''}expires } }`,
			cookie,
		);

		expect(body.errors).toBeUndefined();

		expect(body.data.auth_refresh).toMatchObject({
			...(mode === 'cookie' ? { access_token: expect.any(String) } : {}),
			expires: expect.any(String),
		});

		expect(response.headers.getSetCookie().join('; ')).toContain(
			mode === 'cookie' ? 'directus_refresh_token=' : 'directus_session_token=',
		);
	});
}
