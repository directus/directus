import { randomUUID } from 'node:crypto';
import {
	createCollection,
	createDirectus,
	createItem,
	deleteCollection,
	deleteItem,
	readItem,
	readItems,
	rest,
	staticToken,
	updateCollection,
	updateItem,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const collectionName = `inactive_status_${randomUUID()}`;

const forbidden = {
	errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })],
};

beforeAll(async () => {
	await api.request(
		createCollection({
			collection: collectionName,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
				{
					field: 'title',
					type: 'string',
				},
			],
			schema: {},
			meta: { singleton: false },
		}),
	);
});

afterAll(async () => {
	// Make sure the collection is active again so it can be deleted regardless of test outcome.
	await api.request(updateCollection(collectionName, { meta: { status: 'active' } })).catch(() => {});
	await api.request(deleteCollection(collectionName));
});

test('permits item crud while the collection is active', async () => {
	const seed = await api.request(createItem(collectionName, { title: 'Seed' }));
	const seedItemId = seed['id'];

	const created = await api.request(createItem(collectionName, { title: 'Active' }));
	expect(created).toMatchObject({ title: 'Active' });

	const list = await api.request(readItems(collectionName));
	expect(list.length).toBeGreaterThanOrEqual(2);

	const read = await api.request(readItem(collectionName, seedItemId));
	expect(read).toMatchObject({ id: seedItemId, title: 'Seed' });

	const updated = await api.request(updateItem(collectionName, seedItemId, { title: 'Seed updated' }));
	expect(updated).toMatchObject({ id: seedItemId, title: 'Seed updated' });

	const deleted = await api.request(deleteItem(collectionName, created.id));
	expect(deleted).toBeNull();
});

test('blocks item crud once the collection is set to inactive', async () => {
	// Create an item while the collection is still active so we can assert read/update/delete are
	// blocked once it becomes inactive.
	const seed = await api.request(createItem(collectionName, { title: 'Seed' }));
	const seedItemId = seed['id'];

	// Toggling the collection status is a collection-meta operation and should still succeed.
	const updated = await api.request(updateCollection(collectionName, { meta: { status: 'inactive' } }));
	expect(updated.meta).toMatchObject({ status: 'inactive' });

	// Every item operation must now be rejected because the inactive collection is excluded from the schema.
	await expect(api.request(createItem(collectionName, { title: 'Nope' }))).rejects.toMatchObject(forbidden);
	await expect(api.request(readItems(collectionName))).rejects.toMatchObject(forbidden);
	await expect(api.request(readItem(collectionName, seedItemId))).rejects.toMatchObject(forbidden);
	await expect(api.request(updateItem(collectionName, seedItemId, { title: 'Nope' }))).rejects.toMatchObject(forbidden);
	await expect(api.request(deleteItem(collectionName, seedItemId))).rejects.toMatchObject(forbidden);
});
