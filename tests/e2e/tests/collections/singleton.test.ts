import { randomUUID } from 'node:crypto';
import {
	createCollection,
	createDirectus,
	createField,
	createItem,
	createRelation,
	deleteCollection,
	graphql,
	readSingleton,
	rest,
	staticToken,
	updateSingleton,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterAll, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));

// Hyphens are not valid in a GraphQL type name, so they are stripped from the suffix
const collectionName = `singleton_${randomUUID().replaceAll('-', '')}`;
const childName = `${collectionName}_children`;

afterAll(async () => {
	await api.request(deleteCollection(childName));
	await api.request(deleteCollection(collectionName));
});

test('singleton', async () => {
	const createCol = await api.request(
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
			meta: { singleton: true },
		}),
	);

	expect(createCol).toBeDefined();

	const firstRead = await api.request(readSingleton(collectionName));

	expect(firstRead).toMatchObject({
		id: null,
	});

	const create = await api.request(updateSingleton(collectionName, { title: 'Hello Singleton' }));

	expect(create).toBeDefined();

	const secondRead = await api.request(readSingleton(collectionName));

	expect(secondRead).toMatchObject({
		id: expect.anything(),
		title: 'Hello Singleton',
	});

	await expect(() => api.request(createItem(collectionName, { title: 'Nope' }))).rejects.toThrowError();
});

test('a singleton cannot be addressed by id', async () => {
	const response = await fetch(`http://localhost:${port}/items/${collectionName}/invalid_id`, {
		headers: { Authorization: 'Bearer admin' },
	});

	expect(response.status).toBe(403);
});

test('reading and updating a singleton through graphql', async () => {
	const read = (await api.query(`query { ${collectionName} { title } }`)) as any;

	expect(read[collectionName]).toEqual({ title: 'Hello Singleton' });

	const update = (await api.query(`
		mutation {
			update_${collectionName} (data: { title: "Updated Singleton" }) { title }
		}
	`)) as any;

	expect(update[`update_${collectionName}`]).toEqual({ title: 'Updated Singleton' });
});

test('a singleton can own and update o2m items', async () => {
	await api.request(
		createCollection({
			collection: childName,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
				{ field: 'name', type: 'string' },
				{ field: 'singleton_id', type: 'integer', schema: {} },
			],
			schema: {},
			meta: {},
		}),
	);

	await api.request(
		createField(collectionName, {
			field: 'children',
			type: 'alias',
			meta: { special: ['o2m'], interface: 'list-o2m' },
		}),
	);

	await api.request(
		createRelation({
			collection: childName,
			field: 'singleton_id',
			related_collection: collectionName,
			schema: { on_delete: 'SET NULL' },
			meta: { one_field: 'children', one_deselect_action: 'nullify' },
		}),
	);

	const created = await api.request(
		updateSingleton(collectionName, { children: [{ name: 'Child A' }] } as any, { fields: ['children.*'] } as any),
	);

	expect((created as any).children.map((child: any) => child.name)).toEqual(['Child A']);

	// Updating one child by key while adding another keeps both
	const updated = await api.request(
		updateSingleton(
			collectionName,
			{ children: [{ id: (created as any).children[0].id, name: 'Child A updated' }, { name: 'Child B' }] } as any,
			{ fields: ['children.*'] } as any,
		),
	);

	expect((updated as any).children.map((child: any) => child.name).sort()).toEqual(['Child A updated', 'Child B']);

	const read = (await api.query(`query { ${collectionName} { children { name } } }`)) as any;

	expect(read[collectionName].children.map((child: any) => child.name).sort()).toEqual(['Child A updated', 'Child B']);
});
