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
	readCollection,
	readContentVersion,
	readContentVersions,
	readField,
	readItem,
	readItems,
	readRelationByCollection,
	readRevision,
	readRevisions,
	readShare,
	readShareInfo,
	readShares,
	readSingleton,
	rest,
	saveToContentVersion,
	schemaApply,
	schemaDiff,
	schemaSnapshot,
	staticToken,
	updateCollection,
	updateField,
	updateItem,
	updateSingleton,
	utilitySort,
	utilsExport,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { generateScopedUser } from '@utils/user-scoped.js';
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

		const deleted = await api.request(deleteItem(collection, created['id']));
		expect(deleted).toBeNull();
	});

	test('blocks item crud once the collection is set to inactive', async () => {
		// Create an item while the collection is still active so we can assert read/update/delete are
		// blocked once it becomes inactive.
		const seed = await api.request(createItem(collection, { title: 'Seed' }));
		const seedItemId = seed['id'];

		// Toggling the collection status is a collection-meta operation and should still succeed.
		const updated = await setStatus(collection, 'inactive');
		expect(updated['meta']).toMatchObject({ status: 'inactive' });

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

describe('schema management', () => {
	const collection = `inactive_schema_${uid()}`;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [idField, { field: 'title', type: 'string', meta: {}, schema: {} }],
				schema: {},
				meta: {},
			}),
		);

		await setStatus(collection, 'inactive');
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
	});

	test('keeps fields readable and manageable while inactive', async () => {
		// An inactive collection stays in the schema, only its items are off limits, so everything
		// that manages the collection itself has to keep working.
		await expect(api.request(readField(collection, 'title'))).resolves.toMatchObject({ field: 'title' });

		await expect(
			api.request(updateField(collection, 'title', { meta: { note: 'still editable' } })),
		).resolves.toMatchObject({ meta: expect.objectContaining({ note: 'still editable' }) });

		await expect(
			api.request(createField(collection, { field: 'body', type: 'text', meta: {}, schema: {} })),
		).resolves.toMatchObject({ field: 'body' });
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

	test('degrades wildcards to the foreign key once the related collection is inactive', async () => {
		await setStatus(child, 'inactive');

		// A wildcard never asked to traverse anywhere, so it has to keep working. It degrades to what
		// the column itself holds instead of expanding into the inactive collection.
		await expect(api.request(readItems(parent, { fields: ['*'] }))).resolves.toEqual([
			{ id: expect.any(Number), child_id: childId },
		]);

		await expect(api.request(readItems(parent, { fields: ['*.*'] }))).resolves.toEqual([
			{ id: expect.any(Number), child_id: childId },
		]);

		// Sorting on the column itself is not traversal either
		await expect(api.request(readItems(parent, { fields: ['id'], sort: ['child_id'] as any }))).resolves.toEqual([
			{ id: expect.any(Number) },
		]);
	});

	test('rejects every explicit traversal into the inactive collection', async () => {
		await setStatus(child, 'inactive');

		// Requesting fields through the relation
		await expect(api.request(readItems(parent, { fields: ['child_id.id'] }))).rejects.toMatchObject(inactive);

		// Filtering through the relation
		await expect(
			api.request(readItems(parent, { fields: ['id'], filter: { child_id: { id: { _eq: childId } } } as any })),
		).rejects.toMatchObject(inactive);

		// Sorting through the relation
		await expect(
			api.request(readItems(parent, { fields: ['id'], sort: ['child_id.id'] as any })),
		).rejects.toMatchObject(inactive);
	});

	test('still blocks addressing the inactive collection directly', async () => {
		await setStatus(child, 'inactive');

		await expect(api.request(readItems(child))).rejects.toMatchObject(inactive);
		await expect(api.request(createItem(child, {}))).rejects.toMatchObject(inactive);
	});

	test('restores traversal once the collection is active again', async () => {
		await setStatus(child, 'inactive');
		await setStatus(child, 'active');

		await expect(api.request(readItems(parent, { fields: ['*.*'] }))).resolves.toEqual([
			{ id: expect.any(Number), child_id: { id: childId } },
		]);
	});
});

describe('o2m alias into an inactive collection', () => {
	const parent = `inactive_o2m_parent_${uid()}`;
	const child = `inactive_o2m_child_${uid()}`;

	let childId: number;

	beforeAll(async () => {
		await api.request(createCollection({ collection: parent, fields: [idField], schema: {}, meta: {} }));
		await api.request(createCollection({ collection: child, fields: [idField], schema: {}, meta: {} }));

		// o2m: parent.children <- child.parent_id
		await api.request(createField(child, { field: 'parent_id', type: 'integer', meta: {}, schema: {} }));

		await api.request(
			createField(parent, { field: 'children', type: 'alias', meta: { special: ['o2m'] }, schema: null as any }),
		);

		await api.request(
			createRelation({
				collection: child,
				field: 'parent_id',
				related_collection: parent,
				meta: { one_field: 'children' },
				schema: {},
			}),
		);

		const created = await api.request(createItem(parent, {}));
		const createdChild = await api.request(createItem(child, { parent_id: created['id'] }));
		childId = createdChild['id'];
	});

	afterAll(async () => {
		await setStatus(child, 'active').catch(() => {});
		await api.request(deleteCollection(child)).catch(() => {});
		await api.request(deleteCollection(parent)).catch(() => {});
	});

	test('expands the alias while the related collection is active', async () => {
		await expect(api.request(readItems(parent, { fields: ['*'] }))).resolves.toEqual([
			{ id: expect.any(Number), children: [childId] },
		]);
	});

	test('drops the alias from wildcards once the related collection is inactive', async () => {
		await setStatus(child, 'inactive');

		// Unlike an m2o, an o2m alias has no column to degrade to, so a wildcard has to omit it
		// entirely. Leaving it in made every wildcard read of the parent fail.
		await expect(api.request(readItems(parent, { fields: ['*'] }))).resolves.toEqual([{ id: expect.any(Number) }]);
		await expect(api.request(readItems(parent, { fields: ['*.*'] }))).resolves.toEqual([{ id: expect.any(Number) }]);
	});

	test('rejects explicitly requesting the alias', async () => {
		await setStatus(child, 'inactive');

		await expect(api.request(readItems(parent, { fields: ['children.*'] }))).rejects.toMatchObject(inactive);

		// A count over the alias reaches into the inactive collection just as much as reading it does
		await expect(api.request(readItems(parent, { fields: ['id', 'count(children)'] }))).rejects.toMatchObject(inactive);
	});
});

describe('schema snapshots of an inactive collection', () => {
	const collection = `inactive_snapshot_${uid()}`;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				// `meta` matters here: a column without a `directus_fields` row counts as unmanaged and
				// is left out of snapshots by design, which would mask what this test is checking.
				fields: [
					idField,
					{ field: 'title', type: 'string', meta: {}, schema: {} },
					{ field: 'body', type: 'text', meta: {}, schema: {} },
				],
				schema: {},
				meta: {},
			}),
		);

		await setStatus(collection, 'inactive');
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
	});

	test('keeps the collection and its fields while inactive', async () => {
		const snapshot = await api.request(schemaSnapshot());

		expect(snapshot.collections.find((entry: any) => entry.collection === collection)).toMatchObject({
			meta: expect.objectContaining({ status: 'inactive' }),
		});

		const fields = snapshot.fields
			.filter((field: any) => field.collection === collection)
			.map((field: any) => field.field);

		expect(fields.sort()).toEqual(['body', 'id', 'title']);
	});

	test('does not propose dropping fields when applied after reactivating', async () => {
		const snapshot = await api.request(schemaSnapshot());

		await setStatus(collection, 'active');

		// The dangerous sequence: snapshot while inactive, reactivate later, then apply that snapshot.
		// If the snapshot lost the fields, this diff deletes the columns and the data with them.
		const diff = await api.request(schemaDiff(snapshot)).catch(() => null);

		const fieldDiffs = (diff?.diff?.['fields'] ?? []).filter((entry: any) => entry.collection === collection);

		expect(fieldDiffs).toEqual([]);
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

		// Give the version a delta while the collection is still active, otherwise `promote` bails out
		// with "no changes to promote" before it ever touches the item.
		await api.request(saveToContentVersion(versionId, { title: 'Drafted' }));

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

		await expect(api.request(compareContentVersion(versionId))).rejects.toMatchObject(inactive);
		await expect(api.request(saveToContentVersion(versionId, { title: 'Edited' }))).rejects.toMatchObject(inactive);
		await expect(api.request(promoteContentVersion(versionId, 'nope'))).rejects.toMatchObject(inactive);
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

		await expect(shared.request(readItem(collection, itemId))).rejects.toMatchObject(inactive);
	});
});

describe('who is told that a collection is inactive', () => {
	const collection = `inactive_perms_${uid()}`;

	let permitted = '';
	let unpermitted = '';

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [idField, { field: 'title', type: 'string' }],
				schema: {},
				meta: {},
			}),
		);

		await api.request(createItem(collection, { title: 'Seed' }));

		permitted = (await generateScopedUser(api, { collections: [{ collection }] } as any)).token;
		unpermitted = (await generateScopedUser(api, { collections: [] } as any)).token;

		await setStatus(collection, 'inactive');
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
	});

	const clientFor = (token: string) => createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	test('tells a user who holds permissions on the collection', async () => {
		const client = clientFor(permitted);

		await expect(client.request(readItems(collection))).rejects.toMatchObject(inactive);
		await expect(client.request(createItem(collection, { title: 'Nope' }))).rejects.toMatchObject(inactive);
	});

	test('hides it from a user without permissions', async () => {
		const client = clientFor(unpermitted);

		// Revealing that the collection exists but is inactive would leak the data model
		await expect(client.request(readItems(collection))).rejects.toMatchObject(forbidden);
		await expect(client.request(createItem(collection, { title: 'Nope' }))).rejects.toMatchObject(forbidden);
	});

	test('hides it from an unauthenticated request', async () => {
		const client = createDirectus(`http://localhost:${port}`).with(rest());

		await expect(client.request(readItems(collection))).rejects.toMatchObject(forbidden);
	});
});

describe('the data model of an inactive collection stays manageable', () => {
	const collection = `inactive_model_${uid()}`;
	const related = `inactive_model_rel_${uid()}`;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [idField, { field: 'title', type: 'string', meta: {}, schema: {} }],
				schema: {},
				meta: {},
			}),
		);

		await api.request(createCollection({ collection: related, fields: [idField], schema: {}, meta: {} }));
		await api.request(createField(related, { field: 'link', type: 'integer', meta: {}, schema: {} }));

		await api.request(
			createRelation({ collection: related, field: 'link', related_collection: collection, meta: {}, schema: {} }),
		);

		await setStatus(collection, 'inactive');
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(related)).catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
	});

	test('keeps the collection readable and editable', async () => {
		await expect(api.request(readCollection(collection))).resolves.toMatchObject({ collection });

		await expect(
			api.request(updateCollection(collection, { meta: { note: 'still editable' } })),
		).resolves.toMatchObject({ meta: expect.objectContaining({ note: 'still editable' }) });
	});

	test('keeps relations pointing at it readable', async () => {
		const relations = await api.request(readRelationByCollection(related));

		expect(relations).toEqual([
			expect.objectContaining({ collection: related, field: 'link', related_collection: collection }),
		]);
	});
});

describe('utils and revisions on an inactive collection', () => {
	const collection = `inactive_utils_${uid()}`;
	const singleton = `inactive_single_${uid()}`;

	let revisionId = 0;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [
					idField,
					{ field: 'title', type: 'string', meta: {}, schema: {} },
					{ field: 'sort', type: 'integer', meta: {}, schema: {} },
				],
				schema: {},
				meta: { sort_field: 'sort', accountability: 'all' },
			}),
		);

		const item = await api.request(createItem(collection, { title: 'first' }));
		await api.request(updateItem(collection, item['id'], { title: 'second' }));

		const revisions = await api.request(
			readRevisions({ filter: { collection: { _eq: collection } }, sort: ['-id'], limit: 1 }),
		);

		revisionId = revisions[0]!['id'];

		await api.request(
			createCollection({
				collection: singleton,
				fields: [idField, { field: 'title', type: 'string', meta: {}, schema: {} }],
				schema: {},
				meta: { singleton: true },
			}),
		);

		await setStatus(collection, 'inactive');
		await setStatus(singleton, 'inactive');
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await setStatus(singleton, 'active').catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
		await api.request(deleteCollection(singleton)).catch(() => {});
	});

	test('blocks export and sort', async () => {
		await expect(api.request(utilsExport(collection, 'json', {}, {}))).rejects.toMatchObject(inactive);
		await expect(api.request(utilitySort(collection, 1, 1))).rejects.toMatchObject(inactive);
	});

	test('blocks reverting a revision back into the collection', async () => {
		// The revision row itself stays readable, only writing it back is blocked
		await expect(api.request(readRevision(revisionId))).resolves.toMatchObject({ id: revisionId, collection });

		const response = await fetch(`http://localhost:${port}/utils/revert/${revisionId}`, {
			method: 'POST',
			headers: { Authorization: 'Bearer admin' },
		});

		await expect(response.json()).resolves.toMatchObject(inactive);
	});

	test('blocks reading and writing an inactive singleton', async () => {
		await expect(api.request(readSingleton(singleton))).rejects.toMatchObject(inactive);
		await expect(api.request(updateSingleton(singleton, { title: 'Nope' }))).rejects.toMatchObject(inactive);
	});
});

describe('nested writes into an inactive collection', () => {
	const parent = `inactive_nested_parent_${uid()}`;
	const child = `inactive_nested_child_${uid()}`;

	let parentId = 0;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection: parent,
				fields: [idField, { field: 'title', type: 'string', meta: {}, schema: {} }],
				schema: {},
				meta: {},
			}),
		);

		await api.request(createCollection({ collection: child, fields: [idField], schema: {}, meta: {} }));
		await api.request(createField(child, { field: 'parent_id', type: 'integer', meta: {}, schema: {} }));

		await api.request(
			createField(parent, { field: 'children', type: 'alias', meta: { special: ['o2m'] }, schema: null as any }),
		);

		await api.request(
			createRelation({
				collection: child,
				field: 'parent_id',
				related_collection: parent,
				meta: { one_field: 'children' },
				schema: {},
			}),
		);

		const created = await api.request(createItem(parent, { title: 'Parent' }));
		parentId = created['id'];

		await setStatus(child, 'inactive');
	});

	afterAll(async () => {
		await setStatus(child, 'active').catch(() => {});
		await api.request(deleteCollection(child)).catch(() => {});
		await api.request(deleteCollection(parent)).catch(() => {});
	});

	test('rejects a nested create into the inactive collection', async () => {
		await expect(
			api.request(updateItem(parent, parentId, { children: { create: [{}], update: [], delete: [] } } as any)),
		).rejects.toMatchObject(inactive);
	});

	test('keeps the active parent editable on its own fields', async () => {
		await expect(api.request(updateItem(parent, parentId, { title: 'Renamed' }))).resolves.toMatchObject({
			title: 'Renamed',
		});
	});
});

describe('applying a schema snapshot across the status change', () => {
	const collection = `inactive_apply_${uid()}`;

	beforeAll(async () => {
		await api.request(
			createCollection({
				collection,
				fields: [idField, { field: 'title', type: 'string', meta: {}, schema: {} }],
				schema: {},
				meta: {},
			}),
		);

		await api.request(createItem(collection, { title: 'keep me' }));
	});

	afterAll(async () => {
		await setStatus(collection, 'active').catch(() => {});
		await api.request(deleteCollection(collection)).catch(() => {});
	});

	test('reactivates the collection and leaves its data intact', async () => {
		const snapshot = await api.request(schemaSnapshot());

		await setStatus(collection, 'inactive');
		await expect(api.request(readItems(collection))).rejects.toMatchObject(inactive);

		const diff = await api.request(schemaDiff(snapshot));

		expect(diff.diff['collections']).toEqual([
			expect.objectContaining({
				collection,
				diff: [expect.objectContaining({ path: ['meta', 'status'], lhs: 'inactive', rhs: 'active' })],
			}),
		]);

		await api.request(schemaApply(diff));

		await expect(api.request(readCollection(collection))).resolves.toMatchObject({
			meta: expect.objectContaining({ status: 'active' }),
		});

		await expect(api.request(readItems(collection))).resolves.toEqual([{ id: expect.any(Number), title: 'keep me' }]);
	});
});
