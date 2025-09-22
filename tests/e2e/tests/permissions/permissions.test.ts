import {
	createDirectus,
	createItem,
	createItems,
	createPolicy,
	createUser,
	deleteItem,
	deleteItems,
	readItem,
	readItems,
	rest,
	staticToken,
	updateItem,
	updateItems,
	updatePolicy,
} from '@directus/sdk';
import { expect, test } from 'vitest';
import { useSnapshot } from '@utils/useSnapshot.js';
import type { Schema } from './schema.d.ts';
import { join } from 'path';
import { randomUUID } from 'crypto';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));
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
		users: [
			{
				user: user.id,
			},
		],
		permissions: [],
	}),
);

const train = await api.request(
	createItem(collections.trains, {
		name: 'Train 1',
		category: { name: 'Electric' },
		operators: [{ operators_id: { name: 'Jeff' } }],
		tracks: [{ from: 'Stavanger', to: 'Kristiansand' }],
	}),
);

const userApi = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken(token));

test('reading with admin permissions', async () => {
	const result = await api.request(readItems(collections.trains));
	expect(result.length).toBeGreaterThan(0);
});

test('crud with no permissions', async () => {
	await expect(() =>
		userApi.request(createItems(collections.trains, [{ name: 'Impossible!' }])),
	).rejects.toThrowError();

	await expect(() => userApi.request(createItem(collections.trains, { name: 'Impossible!' }))).rejects.toThrowError();

	await expect(() => userApi.request(readItems(collections.trains))).rejects.toThrowError();
	await expect(() => userApi.request(readItem(collections.trains, train.id!))).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItem(collections.trains, train.id!, { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItems(collections.trains, [String(train.id)], { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() => userApi.request(deleteItem(collections.trains, train.id!))).rejects.toThrowError();
	await expect(() => userApi.request(deleteItems(collections.trains, [String(train.id)]))).rejects.toThrowError();
});

test('crud with create permissions', async () => {
	await api.request(
		updatePolicy(policy.id, {
			permissions: [
				{
					action: 'create',
					collection: collections.trains,
					fields: ['*'],
				} as any,
			],
		}),
	);

	expect(await userApi.request(createItems(collections.trains, [{ name: 'Impossible!' }]))).toBeDefined();
	expect(await userApi.request(createItem(collections.trains, { name: 'Impossible!' }))).toBeDefined();

	await expect(() => userApi.request(readItems(collections.trains))).rejects.toThrowError();
	await expect(() => userApi.request(readItem(collections.trains, train.id!))).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItem(collections.trains, train.id!, { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItems(collections.trains, [String(train.id)], { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() => userApi.request(deleteItem(collections.trains, train.id!))).rejects.toThrowError();

	await expect(() => userApi.request(deleteItems(collections.trains, [String(train.id)]))).rejects.toThrowError();
});

test('crud with read permissions', async () => {
	await api.request(
		updatePolicy(policy.id, {
			permissions: [
				{
					action: 'read',
					collection: collections.trains,
					fields: ['*'],
				} as any,
			],
		}),
	);

	await expect(() =>
		userApi.request(createItems(collections.trains, [{ name: 'Impossible!' }])),
	).rejects.toThrowError();

	await expect(() => userApi.request(createItem(collections.trains, { name: 'Impossible!' }))).rejects.toThrowError();

	expect(await userApi.request(readItems(collections.trains))).toBeDefined();
	expect(await userApi.request(readItem(collections.trains, train.id!))).toBeDefined();

	await expect(() =>
		userApi.request(updateItem(collections.trains, train.id!, { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItems(collections.trains, [String(train.id)], { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() => userApi.request(deleteItem(collections.trains, train.id!))).rejects.toThrowError();

	await expect(() => userApi.request(deleteItems(collections.trains, [String(train.id)]))).rejects.toThrowError();
});

test('crud with update permissions', async () => {
	await api.request(
		updatePolicy(policy.id, {
			permissions: [
				{
					action: 'update',
					collection: collections.trains,
					fields: ['*'],
				} as any,
			],
		}),
	);

	await expect(() =>
		userApi.request(createItems(collections.trains, [{ name: 'Impossible!' }])),
	).rejects.toThrowError();

	await expect(() => userApi.request(createItem(collections.trains, { name: 'Impossible!' }))).rejects.toThrowError();

	await expect(() => userApi.request(readItems(collections.trains))).rejects.toThrowError();
	await expect(() => userApi.request(readItem(collections.trains, train.id!))).rejects.toThrowError();

	expect(await userApi.request(updateItem(collections.trains, train.id!, { name: 'Impossible!' }))).toBeDefined();

	expect(
		await userApi.request(updateItems(collections.trains, [String(train.id)], { name: 'Impossible!' })),
	).toBeDefined();

	await expect(() => userApi.request(deleteItem(collections.trains, train.id!))).rejects.toThrowError();

	await expect(() => userApi.request(deleteItems(collections.trains, [String(train.id)]))).rejects.toThrowError();
});

test('crud with update permissions', async () => {
	await api.request(
		updatePolicy(policy.id, {
			permissions: [
				{
					action: 'delete',
					collection: collections.trains,
					fields: ['*'],
				} as any,
			],
		}),
	);

	await expect(() =>
		userApi.request(createItems(collections.trains, [{ name: 'Impossible!' }])),
	).rejects.toThrowError();

	await expect(() => userApi.request(createItem(collections.trains, { name: 'Impossible!' }))).rejects.toThrowError();

	await expect(() => userApi.request(readItems(collections.trains))).rejects.toThrowError();
	await expect(() => userApi.request(readItem(collections.trains, train.id!))).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItem(collections.trains, train.id!, { name: 'Impossible!' })),
	).rejects.toThrowError();

	await expect(() =>
		userApi.request(updateItems(collections.trains, [String(train.id)], { name: 'Impossible!' })),
	).rejects.toThrowError();

	const [t1, t2, t3] = await Promise.all(
		[1, 2, 3].map((i) =>
			api.request(
				createItem(collections.trains, {
					name: `Train ${i}`,
				}),
			),
		),
	);

	expect(await userApi.request(deleteItem(collections.trains, t1!.id!))).toBeDefined();
	expect(await userApi.request(deleteItems(collections.trains, [String(t2?.id), String(t3?.id)]))).toBeDefined();
});

test('read with fields with access to id', async () => {
	await api.request(
		updatePolicy(policy.id, {
			permissions: [
				{
					action: 'read',
					collection: collections.trains,
					fields: ['id'],
				} as any,
			],
		}),
	);

	expect(await userApi.request(readItem(collections.trains, train.id!))).toEqual({
		id: expect.anything(),
	});
});

test('read with fields with access to id, category', async () => {
	await api.request(
		updatePolicy(
			policy.id,
			{
				permissions: [
					{
						action: 'read',
						collection: collections.trains,
						fields: ['id', 'category'],
					} as any,
				],
			},
			{ fields: '*.*' },
		),
	);

	expect(await userApi.request(readItem(collections.trains, train.id!))).toEqual({
		id: expect.anything(),
		category: expect.anything(),
	});
});
