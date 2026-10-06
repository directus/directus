import { randomUUID } from 'node:crypto';
import { createDirectus, createRole, createUser, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

const api = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

test('login token enforces TFA from a policy on a parent role', async () => {
	const parent = await api.request(
		createRole({
			name: `Parent ${randomUUID()}`,
			policies: [
				{ policy: { name: `Enforce TFA ${randomUUID()}`, admin_access: false, app_access: false, enforce_tfa: true } },
			],
		}),
	);

	const child = await api.request(createRole({ name: `Child ${randomUUID()}`, parent: parent.id }));
	const email = `${randomUUID()}@test.com`;

	await api.request(createUser({ email, password: 'secret', role: child.id }));

	const response = await fetch(`http://localhost:${port}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password: 'secret' }),
	});

	expect(response.status).toBe(200);

	const { data } = await response.json();
	const payload = JSON.parse(Buffer.from(data.access_token.split('.')[1], 'base64url').toString());

	expect(payload).toMatchObject({ enforce_tfa: true });
});
