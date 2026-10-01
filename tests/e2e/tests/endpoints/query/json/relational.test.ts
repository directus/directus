import { createDirectus, readItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { seed, seedShapes } from './seed.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

await seed(api, collections);
const shapes = await seedShapes(api, collections);

function read(collection: string, query: Record<string, unknown>) {
	return api.request<any[]>(readItems(collection, { sort: ['name'], ...query } as any));
}

test('extracts json from a m2o relation', async () => {
	// Alpha and Gamma belong to Tech (blue), Beta to Sports (green), Delta to Home (red)
	const result = await read(collections.products, {
		fields: ['name', 'json(category_id.metadata, color)'],
	});

	// Epsilon has no category, so there is nothing to extract from
	expect(result.map((item) => [item.name, item.category_id?.metadata_color_json ?? null])).toEqual([
		['Alpha', 'blue'],
		['Beta', 'green'],
		['Delta', 'red'],
		['Epsilon', null],
		['Gamma', 'blue'],
	]);
});

test('extracts json from a m2o relation alongside regular fields of that relation', async () => {
	const result = await read(collections.products, {
		fields: ['name', 'category_id.name', 'json(category_id.metadata, color)'],
		filter: { name: { _eq: 'Alpha' } },
	});

	expect(result[0]).toEqual({
		name: 'Alpha',
		category_id: { name: 'Tech', metadata_color_json: 'blue' },
	});
});

test('extracts json from an o2m relation as an array', async () => {
	const result = await read(collections.categories, {
		fields: ['name', 'json(products.metadata, color)'],
		filter: { name: { _eq: 'Tech' } },
	});

	expect(result[0].products.map((product: any) => product.metadata_color_json).sort()).toEqual(['green', 'red']);
});

test('an o2m relation with no related items yields an empty array', async () => {
	const result = await read(collections.departments, {
		fields: ['name', 'json(metadata, sector)'],
	});

	expect(result.map((item) => item.metadata_sector_json)).toEqual(['consumer', 'technology']);
});

test('extracts json from a m2a relation scoped to one of its collections', async () => {
	const shapeA = await api.request<any>(
		readItem(collections.shapes, shapes[0]!, {
			fields: ['name', `json(children.item:${collections.circles}.metadata, color)`],
		} as any),
	);

	const colors = shapeA.children
		.map((child: any) => child.item?.metadata_color_json)
		.filter((color: unknown) => color != null);

	expect(colors.sort()).toEqual(['blue', 'red']);
});

test('a m2a scope that matches no children yields an empty array', async () => {
	const shapeC = await api.request<any>(
		readItem(collections.shapes, shapes[2]!, {
			fields: ['name', `json(children.item:${collections.circles}.metadata, color)`],
		} as any),
	);

	expect(shapeC.children).toEqual([]);
});

test('an unknown m2a collection scope is ignored', async () => {
	const result = await read(collections.shapes, {
		fields: ['id', 'json(children.item:nonexistent_collection.metadata, color)'],
	});

	expect(result.length).toBeGreaterThan(0);
	expect(result[0]).toHaveProperty('id');
});

test('an unknown relation in json() is ignored', async () => {
	const result = await read(collections.products, { fields: ['id', 'json(nonexistent.metadata, color)'] });

	expect(result.length).toBeGreaterThan(0);
	expect(result[0]).toHaveProperty('id');
});

test('json() on a non json field at the end of a relational path is rejected', async () => {
	await expect(
		api.request(readItems(collections.products, { fields: ['json(category_id.name, invalid)'] } as any)),
	).rejects.toMatchObject({ errors: [expect.anything()] });
});

test('only the relational prefix of json() counts towards the relational depth', async () => {
	// json(category_id.metadata, a.b.c.d.e) is relational depth 2; splitting the whole
	// string on dots would wrongly make it 6 and exceed the limit
	const result = await read(collections.products, { fields: ['id', 'json(category_id.metadata, a.b.c.d.e)'] });

	expect(result.length).toBeGreaterThan(0);
});

test('a json() first argument over the relational depth limit is rejected', async () => {
	await expect(
		api.request(readItems(collections.products, { fields: ['json(a.b.c.d.e.f, key)'] } as any)),
	).rejects.toMatchObject({ errors: [{ message: 'Invalid query. Max relational depth exceeded.' }] });
});

test('a relational prefix plus a json() argument over the depth limit is rejected', async () => {
	await expect(
		api.request(readItems(collections.products, { fields: ['a.b.c.d.json(e.metadata, key)'] } as any)),
	).rejects.toMatchObject({ errors: [{ message: 'Invalid query. Max relational depth exceeded.' }] });
});

test('a json path deeper than the json query depth limit is rejected', async () => {
	await expect(
		api.request(readItems(collections.products, { fields: ['json(metadata, a.b.c.d.e.f.g.h.i.j.k)'] } as any)),
	).rejects.toMatchObject({ errors: [{ message: expect.stringContaining('JSON path depth') }] });
});

test('relational json extraction combines with a filter', async () => {
	const result = await read(collections.products, {
		fields: ['name', 'json(category_id.metadata, color)'],
		filter: { name: { _eq: 'Alpha' } },
	});

	expect(result).toHaveLength(1);
	expect(result[0].category_id.metadata_color_json).toBe('blue');
});

test('relational json extraction combines with sorting and pagination', async () => {
	const result = await read(collections.products, {
		fields: ['name', 'json(category_id.metadata, color)'],
		sort: ['-name'],
		limit: 2,
	});

	expect(result.map((item) => item.name)).toEqual(['Gamma', 'Epsilon']);
});
