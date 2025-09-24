import {
	createDirectus,
	createItem,
	createPermission,
	readItemPermissions,
	rest,
	staticToken,
	updateSingleton,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { generateScopedUser } from '@utils/userScoped.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections, snapshot } = await useSnapshot<Schema>(api);

test('get permissions for admin', async () => {
	const item = await api.request(createItem(collections.trains, { name: 'Train 1' }));

	const result = await api.request(readItemPermissions(collections.trains, item.id));

	expect(result).toEqual({
		delete: { access: true },
		share: { access: true },
		update: { access: true },
	});
});

test('get permissions for user', async () => {
	const item = await api.request(createItem(collections.trains, { name: 'Train 2' }));
	const { token, user } = await generateScopedUser(api, snapshot, ['read']);

	const userApi = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	let result = await userApi.request(readItemPermissions(collections.trains, item.id));

	expect(result).toEqual({
		delete: { access: false },
		share: { access: false },
		update: { access: false },
	});

	await api.request(
		createPermission({
			policy: user.policies[0]!.policy,
			action: 'update',
			collection: collections.trains,
			fields: ['*'],
		}),
	);

	result = await userApi.request(readItemPermissions(collections.trains, item.id));

	expect(result).toEqual({
		delete: { access: false },
		share: { access: false },
		update: { access: true },
	});
});

test('get permissions for user on singleton', async () => {
	const { token, user } = await generateScopedUser(api, snapshot, ['read']);

	await api.request(updateSingleton(collections.singleton, { title: 'Singleton' }));

	const userApi = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	await api.request(
		createPermission({
			policy: user.policies[0]!.policy,
			action: 'update',
			collection: collections.singleton,
			fields: ['title'],
		}),
	);

	const result = await userApi.request(readItemPermissions(collections.singleton as any));

	expect(result).toEqual({
		delete: { access: false },
		share: { access: false },
		update: { access: true, fields: ['title'], presets: {} },
	});
});

test('get permissions without auth', async () => {
	const publicApi = createDirectus<Schema>(`http://localhost:${port}`).with(rest());

	const item = await api.request(createItem(collections.trains, { name: 'Train 3' }));

	await expect(() => publicApi.request(readItemPermissions(collections.trains, item.id))).rejects.toThrowError();
});
