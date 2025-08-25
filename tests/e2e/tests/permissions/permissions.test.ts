import { createDirectus, createPolicy, createUser, readItem, readItems, rest, staticToken } from '@directus/sdk';
import { expect, test } from 'vitest';
import { useSnapshot } from '../../utils/useSnapshot';
import { Schema } from './schema';
import { join } from 'path';
import { randomUUID } from 'crypto';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const collections = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));
const token = randomUUID();

const user = await api.request(
	createUser({
		first_name: 'Test',
		last_name: 'Permissions',
		email: `${token}@permissions.com`,
		password: 'password',
		token,
	}),
);

const policy = await api.request(
	createPolicy({
		admin_access: false,
		app_access: false,
		name: 'Permission Test Policy',
		users: [user.id],
		permissions: [],
	}),
);

const userApi = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken(token));

test('reading with no permissions', async () => {
	await expect(() => userApi.request(readItems(collections.trains))).rejects.toThrowError();
});
