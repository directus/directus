import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionProducts, getTestsSchema, seedDBValues } from './json-filter.seed';

const cachedSchema = PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);

const vendorSchemaValues: TestsSchemaVendorValues = {};

beforeAll(async () => {
	await seedDBValues(cachedSchema, vendorSchemaValues);
}, 300_000);

describe('Seed Database Values', () => {
	it.each(vendors)('%s', async (vendor) => {
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

type SuccessCase = {
	description: string;
	filter: object;
	expectedLength?: number;
	minLength?: number;
	expectedNames?: string[];
};

type ErrorCase = {
	description: string;
	filter: object;
};

const SUCCESS_GROUPS: Record<string, SuccessCase[]> = {
	'Equality operators': [
		{
			description: '_eq: filters to exact match',
			filter: { metadata: { _json: { color: { _eq: 'red' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: '_neq: excludes exact match',
			filter: { metadata: { _json: { color: { _neq: 'red' } } } },
			expectedLength: 4,
			expectedNames: ['Beta', 'Gamma', 'Delta', 'Epsilon'],
		},
	],
	'Null operators': [
		{
			description: '_null: filters items where JSON key is absent',
			filter: { metadata: { _json: { brand: { _null: true } } } },
			expectedLength: 1,
			expectedNames: ['Epsilon'],
		},
		{
			description: '_nnull: filters items where JSON key is present',
			filter: { metadata: { _json: { brand: { _nnull: true } } } },
			expectedLength: 4,
			expectedNames: ['Alpha', 'Beta', 'Gamma', 'Delta'],
		},
	],
	'Set operators': [
		{
			description: '_in: filters to items in set',
			filter: { metadata: { _json: { color: { _in: ['red', 'blue'] } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			description: '_nin: filters to items not in set',
			filter: { metadata: { _json: { color: { _nin: ['red', 'blue'] } } } },
			expectedLength: 3,
			expectedNames: ['Gamma', 'Delta', 'Epsilon'],
		},
	],
	'String operators': [
		{
			description: '_contains: filters to items containing substring',
			filter: { metadata: { _json: { brand: { _contains: 'Brand' } } } },
			expectedLength: 4,
		},
		{
			description: '_ncontains: filters to items not containing substring',
			filter: { metadata: { _json: { brand: { _ncontains: 'X' } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Delta'],
		},
		{
			description: '_icontains: case-insensitive substring match',
			filter: { metadata: { _json: { brand: { _icontains: 'BRANDX' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_starts_with: filters to items with matching prefix',
			filter: { metadata: { _json: { brand: { _starts_with: 'BrandX' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_ends_with: filters to items with matching suffix',
			filter: { metadata: { _json: { brand: { _ends_with: 'Y' } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
	],
	'Numeric operators': [
		{
			description: '_gt: filters to items with value greater than threshold',
			filter: { metadata: { _json: { level: { _gt: 3 } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
		{
			description: '_lt: filters to items with value less than threshold',
			filter: { metadata: { _json: { level: { _lt: 5 } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Delta'],
		},
		{
			description: '_gte: filters to items with value greater than or equal to threshold',
			filter: { metadata: { _json: { level: { _gte: 5 } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
		{
			description: '_lte: filters to items with value less than or equal to threshold',
			filter: { metadata: { _json: { level: { _lte: 3 } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Delta'],
		},
	],
	'Range operators': [
		{
			// 'blue' <= color <= 'red'; blue=in, green=in, red=in; black < blue, yellow > red
			description: '_between: filters to items with value in inclusive range',
			filter: { metadata: { _json: { color: { _between: ['blue', 'red'] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			// color NOT in ['blue', 'red']; yellow > red, black < blue
			description: '_nbetween: filters to items with value outside inclusive range',
			filter: { metadata: { _json: { color: { _nbetween: ['blue', 'red'] } } } },
			expectedLength: 2,
			expectedNames: ['Delta', 'Epsilon'],
		},
	],
	'Multi-segment dot path': [
		{
			description: 'filters on nested object path settings.theme',
			filter: { metadata: { _json: { 'settings.theme': { _eq: 'dark' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// Different DBs may treat a missing nested key differently; assert at least Epsilon is returned
			description: '_null on nested path returns item with missing nested key',
			filter: { metadata: { _json: { 'settings.theme': { _null: true } } } },
			minLength: 1,
			expectedNames: ['Epsilon'],
		},
	],
	'Array index path': [
		{
			description: 'filters on first array element tags[0] = electronics',
			filter: { metadata: { _json: { 'tags[0]': { _eq: 'electronics' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: 'filters on first array element tags[0] = home',
			filter: { metadata: { _json: { 'tags[0]': { _eq: 'home' } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
	],
	'Logical combinations': [
		{
			description: '_and: combines two _json conditions',
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
			description: '_or: unions two _json conditions',
			filter: {
				_or: [
					{ metadata: { _json: { color: { _eq: 'red' } } } },
					{ metadata: { _json: { color: { _eq: 'blue' } } } },
				],
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
	],
	'Relational M2O filter': [
		{
			// Tech category has metadata.color='blue'; Alpha and Gamma belong to Tech
			description: 'filters products by JSON field on related category',
			filter: { category_id: { metadata: { _json: { color: { _eq: 'blue' } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
	],
};

const ERROR_CASES: ErrorCase[] = [
	{
		description: 'returns 400 when _json is used on a non-JSON field',
		// name is a string field, not json
		filter: { name: { _json: { path: { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 for unsupported wildcard path expression',
		// wildcard [*] is not a supported path segment
		filter: { metadata: { _json: { 'items[*]': { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 when JSON path depth exceeds maximum (>10 segments)',
		// 11 segments: a.b.c.d.e.f.g.h.i.j.k
		filter: { metadata: { _json: { 'a.b.c.d.e.f.g.h.i.j.k': { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 when _json value is a primitive instead of an object',
		// _json value must be an object, not a string
		filter: { metadata: { _json: 'not-an-object' } },
	},
	{
		description: 'returns 400 when _json inner filter is a primitive instead of an operator object',
		// each path key in _json must map to an operator object, not a string
		filter: { metadata: { _json: { color: 'not-an-object' } } },
	},
];

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionProducts = `${collectionProducts}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('_json filter operator', () => {
			for (const [groupName, cases] of Object.entries(SUCCESS_GROUPS)) {
				describe(groupName, () => {
					describe.each(cases)('$description', ({ filter, expectedLength, minLength, expectedNames }) => {
						it.each(vendors)('%s', async (vendor) => {
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionProducts}`)
								.query({ filter: JSON.stringify(filter), sort: 'name' })
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							expect(response.statusCode).toEqual(200);

							if (minLength !== undefined) {
								expect(response.body.data.length).toBeGreaterThanOrEqual(minLength);
							} else if (expectedLength !== undefined) {
								expect(response.body.data).toHaveLength(expectedLength);
							}

							for (const name of expectedNames ?? []) {
								expect(response.body.data.map((i: any) => i.name)).toContain(name);
							}
						});
					});
				});
			}

			describe('Error cases', () => {
				describe.each(ERROR_CASES)('$description', ({ filter }) => {
					it.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({ filter: JSON.stringify(filter) })
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(400);
					});
				});
			});
		});
	});
});
