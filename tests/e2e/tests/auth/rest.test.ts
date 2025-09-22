import { authentication, createDirectus, createUser, readMe, rest, staticToken } from '@directus/sdk';
import { randomUUID } from 'node:crypto';
import { expect, test } from 'vitest';

const api = createDirectus<unknown>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

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

	const auth = createDirectus<unknown>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken(token));

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

	const auth = createDirectus<unknown>(`http://localhost:${process.env['PORT']}`).with(rest()).with(authentication());

	await auth.login({
		email,
		password: 'secret',
	});

	const me = await auth.request(readMe());

	expect(user.id).toBe(me.id);
});
