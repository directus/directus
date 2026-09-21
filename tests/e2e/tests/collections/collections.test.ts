import { randomUUID } from 'node:crypto';
import {
	createCollection,
	createDirectus,
	createUser,
	deleteCollection,
	readCollection,
	readCollections,
	readFieldsByCollection,
	rest,
	staticToken,
	updateCollection,
	updateCollectionsBatch,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterEach, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const collectionName = `collections_${randomUUID()}`;

test('crud on a collection', async () => {
	const create = await api.request(
		createCollection({
			collection: collectionName,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
			],
			schema: {},
			meta: { singleton: false },
		}),
	);

	expect(create).toBeDefined();

	const read = await api.request(readCollection(collectionName));

	expect(read).toMatchObject({
		collection: collectionName,
		meta: {
			accountability: 'all',
			archive_app_filter: true,
			archive_field: null,
			archive_value: null,
			collapse: 'open',
			collection: collectionName,
			color: null,
			display_template: null,
			group: null,
			hidden: false,
			icon: null,
			item_duplication_fields: null,
			note: null,
			preview_url: null,
			singleton: false,
			sort: null,
			sort_field: null,
			translations: null,
			unarchive_value: null,
			versioning: false,
		},
		schema: {
			name: collectionName,
		},
	});

	const update = await api.request(
		updateCollection(collectionName, {
			meta: {
				note: 'Updated',
			},
		}),
	);

	expect(update).toBeDefined();

	const del = await api.request(deleteCollection(collectionName));

	expect(del).toBeNull();
});

const created: string[] = [];

afterEach(async () => {
	for (const collection of created.splice(0)) {
		await api.request(deleteCollection(collection)).catch(() => {});
	}
});

function name() {
	const collection = `collections_${randomUUID().replaceAll('-', '')}`;
	created.push(collection);
	return collection;
}

/** Every shape below has to end up with the same auto created integer primary key. */
const AUTO_PRIMARY_KEY = [
	{ description: 'no fields key at all', fields: undefined },
	{ description: 'an empty fields array', fields: [] },
	{
		description: 'fields that do not include a primary key',
		fields: [{ field: 'title', type: 'string', meta: { interface: 'input', special: null } }],
	},
];

for (const { description, fields } of AUTO_PRIMARY_KEY) {
	test(`creates a collection with an auto created primary key given ${description}`, async () => {
		const collection = name();

		const result = await api.request(
			createCollection({ collection, meta: {}, schema: {}, ...(fields ? { fields } : {}) } as any),
		);

		expect(result).toMatchObject({ collection, schema: { name: collection } });

		const columns = (await api.request(readFieldsByCollection(collection))).map((field) => field.field);

		expect(columns).toContain('id');

		for (const field of fields ?? []) {
			expect(columns).toContain(field.field);
		}
	});
}

test('creates a collection with an explicit primary key in the fields array', async () => {
	const collection = name();

	await api.request(
		createCollection({
			collection,
			meta: {},
			schema: {},
			fields: [
				{ field: 'title', type: 'string', meta: { interface: 'input', special: null } },
				{
					field: 'key',
					type: 'uuid',
					meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
					schema: { is_primary_key: true, length: 36, has_auto_increment: false },
				},
			],
		} as any),
	);

	const fields = await api.request(readFieldsByCollection(collection));

	expect(fields.find((field) => field.field === 'key')?.schema?.is_primary_key).toBe(true);
	expect(fields.map((field) => field.field)).not.toContain('id');
});

test('creates a folder, which has no table behind it', async () => {
	const collection = name();

	const result = await api.request(createCollection({ collection, meta: {}, schema: null } as any));

	expect(result).toMatchObject({ collection, schema: null });

	const read = await api.request(readCollection(collection));

	expect(read.schema).toBeNull();
});

test('batch updates collections, as used for sorting them', async () => {
	const collections = [name(), name(), name()];
	const sortOrder = [3, 1, 2];

	for (const collection of collections) {
		await api.request(createCollection({ collection, meta: {}, schema: {} } as any));
	}

	const result = await api.request(
		updateCollectionsBatch(
			collections.map((collection, index) => ({
				collection,
				meta: { sort: sortOrder[index], note: String(sortOrder[index]) },
			})) as any,
		),
	);

	for (const [index, collection] of collections.entries()) {
		const updated = result.find((item: any) => item.collection === collection);

		expect(updated).toMatchObject({
			collection,
			meta: { collection, sort: sortOrder[index], note: String(sortOrder[index]) },
			schema: { name: collection },
		});
	}
});

test('a user without admin access cannot manage collections', async () => {
	const token = randomUUID();

	await api.request(
		createUser({
			first_name: 'App',
			last_name: 'User',
			email: `${token}@collections.com`,
			password: 'secret',
			token,
			policies: [{ policy: { name: 'App Access', admin_access: false, app_access: true, permissions: [] } }],
		} as any),
	);

	const userApi = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	// Reading is allowed, but only for the collections the app access policy grants
	const collections = (await userApi.request(readCollections())).map((collection: any) => collection.collection);

	for (const system of ['directus_collections', 'directus_fields', 'directus_users', 'directus_roles']) {
		expect(collections).toContain(system);
	}

	await expect(
		userApi.request(createCollection({ collection: `nope_${token}`, meta: {}, schema: {} } as any)),
	).rejects.toThrowError();

	await expect(userApi.request(deleteCollection('directus_users'))).rejects.toThrowError();
});
