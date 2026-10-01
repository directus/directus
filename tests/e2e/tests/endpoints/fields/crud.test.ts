import { randomUUID } from 'crypto';
import {
	createDirectus,
	createField,
	createUser,
	deleteField,
	readField,
	rest,
	staticToken,
	updateField,
	updateFields,
} from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test('create field', { timeout: database === 'cockroachdb' ? 60_000 : 10_000 }, async () => {
	const field = randomUUID().split('-')[0]!;

	const created = await api.request(
		createField(collections.fields, {
			field,
			type: 'string',
		}),
	);

	expect(created).toMatchObject({
		field,
		type: 'string',
		meta: null,
		schema: {
			is_nullable: true,
		},
	});

	const read = await api.request(readField(collections.fields, field));

	expect(read).toMatchObject({
		field,
		type: 'string',
		meta: null,
		schema: {
			is_nullable: true,
		},
	});

	const update = await api.request(updateField(collections.fields, field, { meta: { display: 'test' } }));

	expect(update).toMatchObject({
		field,
		type: 'string',
		meta: { display: 'test' },
		schema: {
			is_nullable: true,
		},
	});

	await api.request(deleteField(collections.fields, field));

	await expect(api.request(readField(collections.fields, field))).rejects.toThrowError();
});

test('crud on an alias field', async () => {
	const field = `alias_${randomUUID().split('-')[0]!}`;

	const created = await api.request(
		createField(collections.fields, {
			field,
			type: 'alias',
			meta: { interface: 'group-raw', special: ['alias', 'no-data', 'group'] },
		}),
	);

	// An alias has no column behind it, hence no schema
	expect(created).toMatchObject({
		collection: collections.fields,
		field,
		type: 'alias',
		schema: null,
		meta: { interface: 'group-raw', special: ['alias', 'no-data', 'group'] },
	});

	const update = await api.request(updateField(collections.fields, field, { meta: { note: 'aliased' } }));

	expect(update).toMatchObject({ field, type: 'alias', schema: null, meta: { note: 'aliased' } });

	await api.request(deleteField(collections.fields, field));

	await expect(api.request(readField(collections.fields, field))).rejects.toThrowError();
});

test('updates multiple fields of a collection at once', async () => {
	const plain = `multi_${randomUUID().split('-')[0]!}`;
	const alias = `multi_alias_${randomUUID().split('-')[0]!}`;

	await api.request(createField(collections.fields, { field: plain, type: 'string' }));

	await api.request(
		createField(collections.fields, {
			field: alias,
			type: 'alias',
			meta: { interface: 'group-raw', special: ['alias', 'no-data', 'group'] },
		}),
	);

	const result = await api.request(
		updateFields(collections.fields, [
			{ collection: collections.fields, field: plain, meta: { note: 'updated' } },
			{ collection: collections.fields, field: alias, meta: { note: 'updated' } },
		] as any),
	);

	expect(result).toEqual([
		expect.objectContaining({
			field: plain,
			type: 'string',
			meta: expect.objectContaining({ note: 'updated' }),
			schema: expect.objectContaining({ name: plain }),
		}),
		expect.objectContaining({ field: alias, type: 'alias', meta: expect.objectContaining({ note: 'updated' }), schema: null }), // prettier-ignore
	]);

	await api.request(deleteField(collections.fields, plain));
	await api.request(deleteField(collections.fields, alias));
});

test('a user without admin access cannot manage fields', async () => {
	const token = randomUUID();

	await api.request(
		createUser({
			first_name: 'App',
			last_name: 'User',
			email: `${token}@fields.com`,
			password: 'secret',
			token,
			policies: [{ policy: { name: 'App Access', admin_access: false, app_access: true, permissions: [] } }],
		} as any),
	);

	const userApi = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	await expect(
		userApi.request(createField(collections.fields, { field: 'nope', type: 'string' })),
	).rejects.toThrowError();

	await expect(userApi.request(deleteField(collections.fields, 'id'))).rejects.toThrowError();
});
