import { createDirectus, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { seed } from './seed.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

await seed(api, collections);

type Case = {
	description: string;
	filter: object;
	/** Defaults to `products`. */
	collection?: 'products' | 'categories' | 'suppliers';
	expectedLength?: number;
	minLength?: number;
	expectedNames?: string[];
};

const CASES: Record<string, Case[]> = {
	'Equality operators': [
		{
			description: '_eq filters to an exact match',
			filter: { metadata: { _json: { color: { _eq: 'red' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: '_neq excludes an exact match',
			filter: { metadata: { _json: { color: { _neq: 'red' } } } },
			expectedLength: 4,
			expectedNames: ['Beta', 'Gamma', 'Delta', 'Epsilon'],
		},
	],
	'Null operators': [
		{
			description: '_null matches items where the key is absent',
			filter: { metadata: { _json: { brand: { _null: true } } } },
			expectedLength: 1,
			expectedNames: ['Epsilon'],
		},
		{
			description: '_nnull matches items where the key is present',
			filter: { metadata: { _json: { brand: { _nnull: true } } } },
			expectedLength: 4,
			expectedNames: ['Alpha', 'Beta', 'Gamma', 'Delta'],
		},
	],
	'Set operators': [
		{
			description: '_in matches items in the set',
			filter: { metadata: { _json: { color: { _in: ['red', 'blue'] } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: '_nin matches items outside the set',
			filter: { metadata: { _json: { color: { _nin: ['red', 'blue'] } } } },
			expectedLength: 3,
			expectedNames: ['Gamma', 'Delta', 'Epsilon'],
		},
		{
			description: '_in with a single element behaves like _eq',
			filter: { metadata: { _json: { color: { _in: ['red'] } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: '_nin with a single element behaves like _neq',
			filter: { metadata: { _json: { color: { _nin: ['red'] } } } },
			expectedLength: 4,
			expectedNames: ['Beta', 'Gamma', 'Delta', 'Epsilon'],
		},
	],
	'String operators': [
		{
			description: '_contains matches a substring',
			filter: { metadata: { _json: { brand: { _contains: 'Brand' } } } },
			expectedLength: 4,
		},
		{
			description: '_ncontains excludes a substring',
			filter: { metadata: { _json: { brand: { _ncontains: 'X' } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Delta'],
		},
		{
			description: '_icontains matches a substring case insensitively',
			filter: { metadata: { _json: { brand: { _icontains: 'BRANDX' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_starts_with matches a prefix',
			filter: { metadata: { _json: { brand: { _starts_with: 'BrandX' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// BrandY (Beta) and BrandZ (Delta) do not start with BrandX; Epsilon has no brand
			description: '_nstarts_with excludes a prefix',
			filter: { metadata: { _json: { brand: { _nstarts_with: 'BrandX' } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Delta'],
		},
		{
			description: '_istarts_with matches a prefix case insensitively',
			filter: { metadata: { _json: { brand: { _istarts_with: 'brandx' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_ends_with matches a suffix',
			filter: { metadata: { _json: { brand: { _ends_with: 'Y' } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
		{
			description: '_nends_with excludes a suffix',
			filter: { metadata: { _json: { brand: { _nends_with: 'Y' } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Gamma', 'Delta'],
		},
		{
			description: '_iends_with matches a suffix case insensitively',
			filter: { metadata: { _json: { brand: { _iends_with: 'y' } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
	],
	'Numeric operators': [
		{
			description: '_gt matches values above a threshold',
			filter: { metadata: { _json: { level: { _gt: 3 } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
		{
			description: '_lt matches values below a threshold',
			filter: { metadata: { _json: { level: { _lt: 5 } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Delta'],
		},
		{
			description: '_gte matches values at or above a threshold',
			filter: { metadata: { _json: { level: { _gte: 5 } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
		{
			description: '_lte matches values at or below a threshold',
			filter: { metadata: { _json: { level: { _lte: 3 } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Delta'],
		},
	],
	'Range operators': [
		{
			// blue <= color <= red covers blue, green and red; black and yellow fall outside
			description: '_between matches strings in an inclusive range',
			filter: { metadata: { _json: { color: { _between: ['blue', 'red'] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			description: '_nbetween matches strings outside an inclusive range',
			filter: { metadata: { _json: { color: { _nbetween: ['blue', 'red'] } } } },
			expectedLength: 2,
			expectedNames: ['Delta', 'Epsilon'],
		},
		{
			// levels are Alpha 2, Beta 5, Gamma 8, Delta 3, Epsilon absent
			description: '_between matches numbers in an inclusive range',
			filter: { metadata: { _json: { level: { _between: [2, 5] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Delta'],
		},
		{
			description: '_nbetween matches numbers outside an inclusive range',
			filter: { metadata: { _json: { level: { _nbetween: [2, 5] } } } },
			expectedLength: 1,
			expectedNames: ['Gamma'],
		},
		{
			description: '_between with an equal min and max matches only that value',
			filter: { metadata: { _json: { level: { _between: [5, 5] } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
		{
			description: '_nbetween with an equal min and max excludes only that value',
			filter: { metadata: { _json: { level: { _nbetween: [5, 5] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Gamma', 'Delta'],
		},
	],
	'Path syntax': [
		{
			description: 'a multi segment dot path reaches a nested object',
			filter: { metadata: { _json: { 'settings.theme': { _eq: 'dark' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// Databases differ on how a missing nested key compares, so only the certain match is asserted
			description: '_null on a nested path matches an item missing that key',
			filter: { metadata: { _json: { 'settings.theme': { _null: true } } } },
			minLength: 1,
			expectedNames: ['Epsilon'],
		},
		{
			description: 'an array index path reaches the first element',
			filter: { metadata: { _json: { 'tags[0]': { _eq: 'electronics' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: 'an array index path reaches the second element',
			filter: { metadata: { _json: { 'tags[1]': { _eq: 'sale' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: 'a root array index path reaches into the first element',
			filter: { data: { _json: { '[0].test': { _eq: 'foo' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_null false on a root array index path matches items where the key is present',
			filter: { data: { _json: { '[0].test': { _null: false } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			// Delta stores [{}], so the element exists but the key does not
			description: '_null true on a root array index path matches items where the key is absent',
			filter: { data: { _json: { '[0].test': { _null: true } } } },
			minLength: 1,
			expectedNames: ['Delta'],
		},
		{
			description: 'a trailing dot is normalized away',
			filter: { metadata: { _json: { 'color.': { _eq: 'red' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
	],
	'Inline _or and _and': [
		{
			description: '_or returns items matching either condition on one path',
			filter: { metadata: { _json: { _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'blue' } }] } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: '_or returns items matching either of two different paths',
			filter: { metadata: { _json: { _or: [{ color: { _eq: 'red' } }, { level: { _gt: 7 } }] } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_or unions three branches across different paths',
			filter: {
				metadata: {
					_json: { _or: [{ color: { _eq: 'red' } }, { brand: { _eq: 'BrandY' } }, { level: { _gt: 7 } }] },
				},
			},
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			description: '_and requires both conditions to match',
			filter: { metadata: { _json: { _and: [{ color: { _eq: 'red' } }, { brand: { _eq: 'BrandX' } }] } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: '_and narrows with three conditions across different paths',
			filter: {
				metadata: {
					_json: {
						_and: [{ brand: { _starts_with: 'Brand' } }, { level: { _lte: 5 } }, { color: { _neq: 'yellow' } }],
					},
				},
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: '_or as a sibling of a path condition combines as AND',
			filter: {
				metadata: {
					_json: { brand: { _eq: 'BrandX' }, _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'green' } }] },
				},
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_or containing a nested _and branch',
			filter: {
				metadata: {
					_json: {
						_or: [{ _and: [{ color: { _eq: 'red' } }, { level: { _lt: 5 } }] }, { brand: { _eq: 'BrandY' } }],
					},
				},
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: '_and containing a nested _or branch',
			filter: {
				metadata: {
					_json: {
						_and: [{ _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'blue' } }] }, { level: { _lte: 5 } }],
					},
				},
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: 'two path conditions in one _json object both have to match',
			filter: { metadata: { _json: { color: { _eq: 'red' }, brand: { _nnull: true } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: 'three path conditions in one _json object narrow the result',
			filter: {
				metadata: { _json: { brand: { _starts_with: 'Brand' }, level: { _lte: 3 }, color: { _neq: 'black' } } },
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Delta'],
		},
	],
	'Combined with regular filters': [
		{
			description: '_and combines two _json conditions',
			filter: {
				_and: [
					{ metadata: { _json: { color: { _eq: 'red' } } } },
					{ metadata: { _json: { brand: { _eq: 'BrandX' } } } },
				],
			},
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: '_or unions two _json conditions',
			filter: {
				_or: [{ metadata: { _json: { color: { _eq: 'red' } } } }, { metadata: { _json: { color: { _eq: 'blue' } } } }],
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: 'a nested _and containing _or',
			filter: {
				_and: [
					{
						_or: [
							{ metadata: { _json: { color: { _eq: 'red' } } } },
							{ metadata: { _json: { color: { _eq: 'blue' } } } },
						],
					},
					{ metadata: { _json: { level: { _lte: 5 } } } },
				],
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: '_and mixes a _json filter with a regular field filter',
			filter: {
				_and: [{ metadata: { _json: { brand: { _starts_with: 'Brand' } } } }, { name: { _neq: 'Alpha' } }],
			},
			expectedLength: 3,
			expectedNames: ['Beta', 'Gamma', 'Delta'],
		},
		{
			description: '_or mixes a _json filter with a regular field filter',
			filter: { _or: [{ metadata: { _json: { level: { _gt: 6 } } } }, { name: { _eq: 'Delta' } }] },
			expectedLength: 2,
			expectedNames: ['Gamma', 'Delta'],
		},
		{
			description: 'a filter matching nothing returns an empty result',
			filter: { metadata: { _json: { color: { _eq: 'purple' } } } },
			expectedLength: 0,
		},
	],
	Relational: [
		{
			description: 'filters products by a json field on the related m2o category',
			filter: { category_id: { metadata: { _json: { color: { _eq: 'blue' } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: 'filters categories by a json color on any of their o2m products',
			filter: { products: { metadata: { _json: { color: { _eq: 'red' } } } } },
			collection: 'categories',
			expectedLength: 1,
			expectedNames: ['Tech'],
		},
		{
			description: 'filters categories by a json level on any of their o2m products',
			filter: { products: { metadata: { _json: { level: { _gt: 4 } } } } },
			collection: 'categories',
			expectedLength: 2,
			expectedNames: ['Sports', 'Tech'],
		},
		{
			description: 'filters products by a json region on any linked m2m supplier',
			filter: { suppliers: { suppliers_id: { metadata: { _json: { region: { _eq: 'EU' } } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: 'filters products by a json tier on any linked m2m supplier',
			filter: { suppliers: { suppliers_id: { metadata: { _json: { tier: { _gt: 1 } } } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
		{
			description: '_some matches categories with at least one product above a json level',
			filter: { products: { _some: { metadata: { _json: { level: { _gt: 6 } } } } } },
			collection: 'categories',
			expectedLength: 1,
			expectedNames: ['Tech'],
		},
		{
			description: '_none matches categories with no product above a json level',
			filter: { products: { _none: { metadata: { _json: { level: { _gt: 6 } } } } } },
			collection: 'categories',
			expectedLength: 2,
			expectedNames: ['Home', 'Sports'],
		},
		{
			// Epsilon is the only black product and it has no category
			description: '_none matches every category when no product has the json color',
			filter: { products: { _none: { metadata: { _json: { color: { _eq: 'black' } } } } } },
			collection: 'categories',
			expectedLength: 3,
			expectedNames: ['Home', 'Sports', 'Tech'],
		},
		{
			description: 'two m2o levels reach the grandparent department json sector',
			filter: { category_id: { department_id: { metadata: { _json: { sector: { _eq: 'technology' } } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: 'two m2o levels reach the grandparent department json budget',
			filter: { category_id: { department_id: { metadata: { _json: { budget: { _gte: 75 } } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: 'o2m into m2m reaches the suppliers of a category products',
			filter: {
				products: { suppliers: { suppliers_id: { metadata: { _json: { region: { _eq: 'EU' } } } } } },
			},
			collection: 'categories',
			expectedLength: 2,
			expectedNames: ['Sports', 'Tech'],
		},
	],
};

const ERROR_CASES: { description: string; filter: object }[] = [
	{ description: '_json on a non json field', filter: { name: { _json: { path: { _eq: 'val' } } } } },
	{ description: 'a wildcard path expression', filter: { metadata: { _json: { 'items[*]': { _eq: 'val' } } } } },
	{
		description: 'a path deeper than the maximum of ten segments',
		filter: { metadata: { _json: { 'a.b.c.d.e.f.g.h.i.j.k': { _eq: 'val' } } } },
	},
	{ description: 'a primitive as the _json value', filter: { metadata: { _json: 'not-an-object' } } },
	{ description: 'null as the _json value', filter: { metadata: { _json: null } } },
	{ description: 'a primitive as a path condition', filter: { metadata: { _json: { color: 'not-an-object' } } } },
	{ description: '_or that is not an array', filter: { metadata: { _json: { _or: { color: { _eq: 'red' } } } } } },
	{ description: '_and that is not an array', filter: { metadata: { _json: { _and: { color: { _eq: 'red' } } } } } },
	{ description: '_or containing a null entry', filter: { metadata: { _json: { _or: [null] } } } },
	{ description: 'a $ root reference in the path', filter: { metadata: { _json: { '$.color': { _eq: 'val' } } } } },
	{ description: 'an @ current node reference in the path', filter: { metadata: { _json: { '@.color': { _eq: 'val' } } } } }, // prettier-ignore
	{ description: 'a ? filter expression in the path', filter: { metadata: { _json: { '?(color)': { _eq: 'val' } } } } },
	{ description: 'an empty bracket subscript', filter: { metadata: { _json: { 'items[]': { _eq: 'val' } } } } },
	{ description: 'an empty path key', filter: { metadata: { _json: { '': { _eq: 'val' } } } } },
	{
		description: 'a repeated dot in the path',
		filter: { metadata: { _json: { 'settings..theme': { _eq: 'dark' } } } },
	},
	{
		description: 'a path key nested inside another path key',
		filter: { metadata: { _json: { 'a.b': { 'c[0]': { _eq: 1 } } } } },
	},
	{ description: '_in with a string instead of an array', filter: { metadata: { _json: { color: { _in: 'red' } } } } },
	{ description: '_in with an empty array', filter: { metadata: { _json: { color: { _in: [] } } } } },
	{ description: '_nin with an empty array', filter: { metadata: { _json: { color: { _nin: [] } } } } },
	{ description: '_between with a non array value', filter: { metadata: { _json: { level: { _between: 5 } } } } },
	{ description: '_between with an empty array', filter: { metadata: { _json: { level: { _between: [] } } } } },
	{ description: '_null with a non boolean value', filter: { metadata: { _json: { color: { _null: 'yes' } } } } },
	{ description: '_nnull with a non boolean value', filter: { metadata: { _json: { color: { _nnull: 'yes' } } } } },
	{ description: '_eq with an empty string', filter: { metadata: { _json: { color: { _eq: '' } } } } },
];

for (const [group, cases] of Object.entries(CASES)) {
	for (const { description, filter, collection = 'products', expectedLength, minLength, expectedNames } of cases) {
		test(`${group}: ${description}`, async () => {
			const result = await api.request(readItems(collections[collection], { filter: filter as any, sort: ['name'] }));

			if (minLength !== undefined) {
				expect(result.length).toBeGreaterThanOrEqual(minLength);
			} else if (expectedLength !== undefined) {
				expect(result).toHaveLength(expectedLength);
			}

			for (const name of expectedNames ?? []) {
				expect(result.map((item: any) => item.name)).toContain(name);
			}
		});
	}
}

for (const { description, filter } of ERROR_CASES) {
	test(`rejects ${description}`, async () => {
		await expect(api.request(readItems(collections.products, { filter: filter as any }))).rejects.toMatchObject({
			errors: [{ extensions: { code: 'INVALID_QUERY' } }],
		});
	});
}

test('a _json filter can be applied inside a deep o2m query', async () => {
	// Tech holds Alpha (red) and Gamma (green); the deep filter keeps only the red one
	const result = await api.request(
		readItems(collections.categories, {
			fields: ['name', 'products.name'],
			sort: ['name'],
			deep: { products: { _filter: { metadata: { _json: { color: { _eq: 'red' } } } } } } as any,
		}),
	);

	const byName = Object.fromEntries(result.map((item: any) => [item.name, item.products.map((p: any) => p.name)]));

	expect(byName).toEqual({ Home: [], Sports: [], Tech: ['Alpha'] });
});

test('a json() sort can be applied inside a deep o2m query', async () => {
	const result = await api.request(
		readItems(collections.categories, {
			fields: ['name', 'products.name'],
			filter: { name: { _eq: 'Tech' } },
			deep: { products: { _sort: ['-json(metadata, level)'] } } as any,
		}),
	);

	expect((result[0] as any).products.map((p: any) => p.name)).toEqual(['Gamma', 'Alpha']);
});

test('a _json filter and a json() sort combine inside a deep o2m query', async () => {
	const result = await api.request(
		readItems(collections.categories, {
			fields: ['name', 'products.name'],
			filter: { name: { _eq: 'Tech' } },
			deep: {
				products: { _filter: { metadata: { _json: { brand: { _eq: 'BrandX' } } } }, _sort: ['json(metadata, level)'] },
			} as any,
		}),
	);

	expect((result[0] as any).products.map((p: any) => p.name)).toEqual(['Alpha', 'Gamma']);
});
