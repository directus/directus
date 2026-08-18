import { randomUUID } from 'node:crypto';
import {
	authenticateShare,
	compareContentVersion,
	createCollection,
	createContentVersion,
	createDirectus,
	createField,
	createItem,
	createRelation,
	createShare,
	deleteCollection,
	deleteItem,
	promoteContentVersion,
	readContentVersion,
	readContentVersions,
	readItem,
	readItems,
	readShare,
	readShareInfo,
	readShares,
	rest,
	saveToContentVersion,
	staticToken,
	updateCollection,
	updateItem,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const uid = () => randomUUID().replaceAll('-', '');

const idField = {
	field: 'id',
	type: 'integer' as const,
	meta: { hidden: true },
	schema: { is_primary_key: true, has_auto_increment: true },
};

/**
 * Admins (and anyone else holding permissions on the collection) are told the collection is
 * inactive, everyone else gets a generic forbidden. See `collectionExists`.
 */
const inactive = {
	errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'COLLECTION_INACTIVE' }) })],
};

const forbidden = {
	errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })],
};

const setStatus = (collection: string, status: 'active' | 'inactive') =>
	api.request(updateCollection(collection, { meta: { status } }));

describe('item crud', () => {
	const collection = `inactive_crud_${uid()}`;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [idField, { field: 'title', type: 'string' }],
				schema: {},
				meta: { singleton: false },
			}),
		);
	});

	afterAll(async () => {
		// Make sure the collection is active again so it can be deleted regardless of test outcome.
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(collection));
	});

	test('permits item crud while the collection is active', async () => {
		const seed = await api.request(createItem(collection, { title: 'Seed' }));
		const seedItemId = seed['id'];

		const created = await api.request(createItem(collection, { title: 'Active' }));
		expect(created).toMatchObject({ title: 'Active' });

		const list = await api.request(readItems(collection));
		expect(list.length).toBeGreaterThanOrEqual(2);

		const read = await api.request(readItem(collection, seedItemId));
		expect(read).toMatchObject({ id: seedItemId, title: 'Seed' });

		const updated = await api.request(updateItem(collection, seedItemId, { title: 'Seed updated' }));
		expect(updated).toMatchObject({ id: seedItemId, title: 'Seed updated' });

		const deleted = await api.request(deleteItem(collection, created.id));
		expect(deleted).toBeNull();
	});

	test('blocks item crud once the collection is set to inactive', async () => {
		// Create an item while the collection is still active so we can assert read/update/delete are
		// blocked once it becomes inactive.
		const seed = await api.request(createItem(collection, { title: 'Seed' }));
		const seedItemId = seed['id'];

		// Toggling the collection status is a collection-meta operation and should still succeed.
		const updated = await setStatus(collection, 'inactive');
		expect(updated.meta).toMatchObject({ status: 'inactive' });

		// Every item operation must now be rejected because the inactive collection is excluded from the schema.
		await expect(api.request(createItem(collection, { title: 'Nope' }))).rejects.toMatchObject(inactive);
		await expect(api.request(readItems(collection))).rejects.toMatchObject(inactive);
		await expect(api.request(readItem(collection, seedItemId))).rejects.toMatchObject(inactive);
		await expect(api.request(updateItem(collection, seedItemId, { title: 'Nope' }))).rejects.toMatchObject(inactive);
		await expect(api.request(deleteItem(collection, seedItemId))).rejects.toMatchObject(inactive);
	});

	test('reports a collection that never existed as forbidden, not inactive', async () => {
		await expect(api.request(readItems(`does_not_exist_${uid()}`))).rejects.toMatchObject(forbidden);
	});
});

describe('relations into an inactive collection', () => {
	const parent = `inactive_rel_parent_${uid()}`;
	const child = `inactive_rel_child_${uid()}`;

	let childId: number;

	beforeAll(async () => {
		await api.request(createCollection({ collection: child, fields: [idField], schema: {}, meta: {} }));
		await api.request(createCollection({ collection: parent, fields: [idField], schema: {}, meta: {} }));

		// m2o: parent.child_id -> child
		await api.request(createField(parent, { field: 'child_id', type: 'integer', meta: {}, schema: {} }));

		await api.request(
			createRelation({ collection: parent, field: 'child_id', related_collection: child, meta: {}, schema: {} }),
		);

		const created = await api.request(createItem(child, {}));
		childId = created['id'];
		await api.request(createItem(parent, { child_id: childId }));
	});

	afterAll(async () => {
		await setStatus(child, 'active').catch(() => {});
		await api.request(deleteCollection(parent)).catch(() => {});
		await api.request(deleteCollection(child)).catch(() => {});
	});

	test('expands the relation while the related collection is active', async () => {
		const result = await api.request(readItems(parent, { fields: ['*.*'] }));

		expect(result).toEqual([{ id: expect.any(Number), child_id: { id: childId } }]);
	});

	test('does not fail queries once the related collection is inactive', async () => {
		await setStatus(child, 'inactive');

		// A relation whose related collection left the schema used to crash AST construction with
		// "Cannot read properties of undefined (reading 'primary')"
		await expect(api.request(readItems(parent, { fields: ['*'] }))).resolves.toEqual([
			{ id: expect.any(Number), child_id: childId },
		]);

		// `*.*` degrades to what `*` returns for the field that can no longer be traversed
		await expect(api.request(readItems(parent, { fields: ['*.*'] }))).resolves.toEqual([
			{ id: expect.any(Number), child_id: childId },
		]);

		await expect(api.request(readItems(parent, { fields: ['child_id'] }))).resolves.toEqual([{ child_id: childId }]);

		await expect(api.request(readItems(parent, { fields: ['id'], sort: ['child_id'] as any }))).resolves.toEqual([
			{ id: expect.any(Number) },
		]);
	});

	test('rejects explicitly requesting fields through a relation to an inactive collection', async () => {
		await setStatus(child, 'inactive');

		await expect(api.request(readItems(parent, { fields: ['child_id.id'] }))).rejects.toMatchObject(forbidden);
	});

	test('rejects filtering through a relation to an inactive collection', async () => {
		await setStatus(child, 'inactive');

		await expect(
			api.request(readItems(parent, { fields: ['id'], filter: { child_id: { id: { _eq: childId } } } as any })),
		).rejects.toMatchObject(forbidden);
	});
});

describe('stored references to a collection that later went inactive', () => {
	const collection = `inactive_refs_${uid()}`;

	let itemId: number;
	let versionId: string;
	let shareId: string;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [idField, { field: 'title', type: 'string' }],
				schema: {},
				meta: { versioning: true },
			}),
		);

		const item = await api.request(createItem(collection, { title: 'Original' }));
		itemId = item['id'];

		const version = await api.request(createContentVersion({ key: 'draft', collection, item: String(itemId) }));
		versionId = version['id'];

		const share = await api.request(createShare({ collection, item: String(itemId), name: 'inactive share' }));
		shareId = share['id'];

		await setStatus(collection, 'inactive');
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
	});

	test('keeps version metadata readable but blocks anything dereferencing the item', async () => {
		await expect(api.request(readContentVersions())).resolves.toEqual(expect.any(Array));
		await expect(api.request(readContentVersion(versionId))).resolves.toMatchObject({ id: versionId, collection });

		await expect(api.request(compareContentVersion(versionId))).rejects.toMatchObject(forbidden);
		await expect(api.request(saveToContentVersion(versionId, { title: 'Edited' }))).rejects.toMatchObject(forbidden);
		await expect(api.request(promoteContentVersion(versionId, 'nope'))).rejects.toMatchObject(forbidden);
	});

	test('keeps share metadata readable but blocks item access through the share', async () => {
		await expect(api.request(readShares())).resolves.toEqual(expect.any(Array));
		await expect(api.request(readShare(shareId))).resolves.toMatchObject({ id: shareId, collection });
		await expect(api.request(readShareInfo(shareId))).resolves.toMatchObject({ id: shareId });

		// A share token is still issued, but it grants no access to the inactive collection.
		const auth = await api.request(authenticateShare(shareId, undefined, 'json'));
		expect(auth.access_token).toEqual(expect.any(String));

		const shared = createDirectus(`http://localhost:${port}`)
			.with(rest())
			.with(staticToken(auth.access_token as string));

		await expect(shared.request(readItem(collection, itemId))).rejects.toMatchObject(forbidden);
	});
});
