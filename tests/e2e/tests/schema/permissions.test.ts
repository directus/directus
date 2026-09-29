import { randomUUID } from 'node:crypto';
import { createDirectus, createUser, rest, schemaSnapshot, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

/** Creates a user whose policy has neither admin nor app access unless asked for. */
async function createScopedUser(appAccess: boolean) {
	const token = randomUUID();

	await api.request(
		createUser({
			first_name: 'Schema',
			last_name: appAccess ? 'App' : 'Api',
			email: `${token}@schema.com`,
			password: 'secret',
			token,
			policies: [{ policy: { name: `Schema ${token}`, admin_access: false, app_access: appAccess, permissions: [] } }],
		} as any),
	);

	return token;
}

const tokens = {
	'app access': await createScopedUser(true),
	'api only': await createScopedUser(false),
	unauthenticated: null,
};

for (const [description, token] of Object.entries(tokens)) {
	const headers = token ? { Authorization: `Bearer ${token}` } : {};

	test(`the schema endpoints are denied to an ${description} user`, async () => {
		const snapshot = await fetch(`http://localhost:${port}/schema/snapshot`, { headers });

		const diff = await fetch(`http://localhost:${port}/schema/diff`, {
			method: 'POST',
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ version: 1, directus: '0.0.0', collections: [], fields: [], relations: [] }),
		});

		const apply = await fetch(`http://localhost:${port}/schema/apply`, {
			method: 'POST',
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ hash: 'nope', diff: { collections: [], fields: [], relations: [] } }),
		});

		expect(snapshot.status).toBe(403);
		expect(diff.status).toBe(403);
		expect(apply.status).toBe(403);
	});
}

test('a snapshot can be exported as yaml', async () => {
	const json = await api.request(schemaSnapshot());

	const response = await fetch(`http://localhost:${port}/schema/snapshot?export=yaml`, {
		headers: { Authorization: 'Bearer admin' },
	});

	expect(response.status).toBe(200);

	const yaml = await response.text();

	expect(yaml).toContain(`directus: ${json.directus}`);
	expect(yaml).toContain('collections:');
});
