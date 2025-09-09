import { authentication, createDirectus, createUser, graphql, rest, staticToken } from '@directus/sdk';
import { randomUUID } from 'node:crypto';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

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

	const auth = createDirectus(`http://localhost:${process.env['PORT']}`).with(graphql()).with(authentication());

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
