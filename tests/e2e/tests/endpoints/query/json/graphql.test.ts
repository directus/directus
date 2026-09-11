import { createDirectus, graphql, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { seedFunctionProducts } from './seed.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

await seedFunctionProducts(api, collections);

/** Runs a `_json` filter whose path is passed as a variable, which is required for paths that are not GraphQL identifiers. */
function filterByVariable(jsonFilter: object) {
	return api.query<any>(
		`query ($jsonFilter: GraphQLJsonFilter) {
			${collections.products}(filter: { metadata: { _json: $jsonFilter } }, sort: ["name"]) { name }
		}`,
		{ jsonFilter },
	);
}

test('_json filter accepts an inline path condition', async () => {
	const result = await api.query<any>(`
		query {
			${collections.products}(filter: { metadata: { _json: { color: { _eq: "red" } } } }, sort: ["name"]) { name }
		}
	`);

	expect(result[collections.products].map((item: any) => item.name)).toEqual(['Alpha']);
});

test('_json filter accepts inline _or and _and branches', async () => {
	const result = await api.query<any>(`
		query {
			or: ${collections.products}(
				filter: { metadata: { _json: { _or: [{ color: { _eq: "red" } }, { color: { _eq: "blue" } }] } } }
				sort: ["name"]
			) { name }
			and: ${collections.products}(
				filter: { metadata: { _json: { _and: [{ color: { _eq: "red" } }, { brand: { _eq: "BrandX" } }] } } }
				sort: ["name"]
			) { name }
		}
	`);

	expect(result.or.map((item: any) => item.name)).toEqual(['Alpha', 'Beta']);
	expect(result.and.map((item: any) => item.name)).toEqual(['Alpha']);
});

test('_json filter accepts a multi segment dot path through a variable', async () => {
	const result = await filterByVariable({ 'dimensions.width': { _eq: 10 } });

	expect(result[collections.products].map((item: any) => item.name)).toEqual(['Alpha']);
});

test('_json filter accepts an array index path through a variable', async () => {
	const result = await filterByVariable({ 'tags[0]': { _eq: 'electronics' } });

	expect(result[collections.products].map((item: any) => item.name)).toEqual(['Alpha']);
});

test('_null and _nnull apply to the json column itself', async () => {
	const result = await api.query<any>(`
		query {
			isNull: ${collections.products}(filter: { data: { _null: true } }, sort: ["name"]) { name }
			notNull: ${collections.products}(filter: { data: { _nnull: true } }, sort: ["name"]) { name }
		}
	`);

	expect(result.isNull.map((item: any) => item.name)).toEqual(['Zeta']);
	expect(result.notNull.map((item: any) => item.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
});

const INVALID_PATHS = [
	{ description: 'a wildcard path expression', path: 'items[*]' },
	{ description: 'a path deeper than the maximum of ten segments', path: 'a.b.c.d.e.f.g.h.i.j.k' },
	{ description: 'a $ root reference', path: '$.color' },
	{ description: 'an @ current node reference', path: '@.color' },
	{ description: 'a ? filter expression', path: '?(color)' },
	{ description: 'an empty bracket subscript', path: 'items[]' },
	{ description: 'an empty path key', path: '' },
];

for (const { description, path } of INVALID_PATHS) {
	test(`rejects ${description}`, async () => {
		await expect(filterByVariable({ [path]: { _eq: 'val' } })).rejects.toMatchObject({
			errors: [expect.anything()],
		});
	});
}

test('json() returns a scalar at a top level path', async () => {
	const result = await api.query<any>(`
		query {
			${collections.products}(sort: ["name"]) {
				name
				metadata_func { json(path: "color") }
			}
		}
	`);

	expect(result[collections.products].map((item: any) => item.metadata_func.json)).toEqual([
		'red',
		'blue',
		'green',
		'black',
	]);
});

test('json() can be aliased more than once on the same column', async () => {
	const result = await api.query<any>(`
		query {
			${collections.products}(sort: ["name"], limit: 1) {
				name
				metadata_func {
					width: json(path: "dimensions.width")
					height: json(path: "dimensions.height")
					firstTag: json(path: "tags[0]")
				}
			}
		}
	`);

	const [alpha] = result[collections.products];

	expect(Number(alpha.metadata_func.width)).toBe(10);
	expect(Number(alpha.metadata_func.height)).toBe(20);
	expect(alpha.metadata_func.firstTag).toBe('electronics');
});

test('json() returns objects and arrays as parsed json', async () => {
	const result = await api.query<any>(`
		query {
			${collections.products}(sort: ["name"], limit: 1) {
				metadata_func {
					dimensions: json(path: "dimensions")
					tags: json(path: "tags")
				}
			}
		}
	`);

	const [alpha] = result[collections.products];

	expect(alpha.metadata_func.dimensions).toEqual({ width: 10, height: 20, depth: 5 });
	expect(alpha.metadata_func.tags).toEqual(['electronics', 'premium', 'new']);
});

test('json() reads from two different json columns in one query', async () => {
	const result = await api.query<any>(`
		query {
			${collections.products}(sort: ["name"], limit: 1) {
				metadata_func { color: json(path: "color") }
				data_func { theme: json(path: "theme") }
			}
		}
	`);

	const [alpha] = result[collections.products];

	expect(alpha.metadata_func.color).toBe('red');
	expect(alpha.data_func.theme).toBe('dark');
});

test('json() returns null when the path is absent', async () => {
	const result = await api.query<any>(`
		query {
			${collections.products}(filter: { name: { _eq: "Zeta" } }) {
				metadata_func { json(path: "brand") }
			}
		}
	`);

	expect(result[collections.products][0].metadata_func.json).toBeNull();
});

test('json() without a path argument fails schema validation', async () => {
	await expect(
		api.query<any>(`
			query {
				${collections.products} {
					metadata_func { json }
				}
			}
		`),
	).rejects.toMatchObject({ errors: [expect.anything()] });
});
