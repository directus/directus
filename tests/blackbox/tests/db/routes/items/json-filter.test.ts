import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import {
	collectionCategories,
	collectionProducts,
	collectionSuppliers,
	getTestsSchema,
	seedDBValues,
} from './json-filter.seed';

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
	// Which collection to query; defaults to products
	targetCollection?: 'products' | 'categories' | 'suppliers';
};

type ErrorCase = {
	description: string;
	filter: object;
};

const getSuccessGroups = (localCollectionSuppliers: string): Record<string, SuccessCase[]> => ({
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
			description: '_nstarts_with: filters to items not matching prefix',
			// BrandY(Beta) and BrandZ(Delta) don't start with BrandX; null brand (Epsilon) excluded
			filter: { metadata: { _json: { brand: { _nstarts_with: 'BrandX' } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Delta'],
		},
		{
			description: '_istarts_with: case-insensitive prefix match',
			filter: { metadata: { _json: { brand: { _istarts_with: 'brandx' } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			description: '_ends_with: filters to items with matching suffix',
			filter: { metadata: { _json: { brand: { _ends_with: 'Y' } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
		{
			description: '_nends_with: filters to items not matching suffix',
			// BrandX(Alpha, Gamma) and BrandZ(Delta) don't end with Y; null brand (Epsilon) excluded
			filter: { metadata: { _json: { brand: { _nends_with: 'Y' } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Gamma', 'Delta'],
		},
		{
			description: '_iends_with: case-insensitive suffix match',
			// BrandY ends with 'y' case-insensitively
			filter: { metadata: { _json: { brand: { _iends_with: 'y' } } } },
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
			description: '_between (string): filters to items with string value in inclusive range',
			filter: { metadata: { _json: { color: { _between: ['blue', 'red'] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			// color NOT in ['blue', 'red']; yellow > red, black < blue
			description: '_nbetween (string): filters to items with string value outside inclusive range',
			filter: { metadata: { _json: { color: { _nbetween: ['blue', 'red'] } } } },
			expectedLength: 2,
			expectedNames: ['Delta', 'Epsilon'],
		},
		{
			// level values: Alpha=2, Beta=5, Gamma=8, Delta=3, Epsilon=null
			// [2, 5] includes Alpha(2), Beta(5), Delta(3); excludes Gamma(8) and Epsilon(null)
			description: '_between (numeric): filters to items with numeric value in inclusive range',
			filter: { metadata: { _json: { level: { _between: [2, 5] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Delta'],
		},
		{
			// outside [2, 5]: only Gamma(8); Epsilon has no level (null, not matched)
			description: '_nbetween (numeric): filters to items with numeric value outside inclusive range',
			filter: { metadata: { _json: { level: { _nbetween: [2, 5] } } } },
			expectedLength: 1,
			expectedNames: ['Gamma'],
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
		{
			// Alpha tags: ['electronics', 'sale'] → tags[1] = 'sale'
			description: 'filters on second array element tags[1] = sale',
			filter: { metadata: { _json: { 'tags[1]': { _eq: 'sale' } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			// Beta tags: ['home', 'new'] → tags[1] = 'new'
			description: 'filters on second array element tags[1] = new',
			filter: { metadata: { _json: { 'tags[1]': { _eq: 'new' } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
	],
	'Inline _or/_and inside _json': [
		{
			// color='red': Alpha; color='blue': Beta
			description: '_or: returns items matching either path condition',
			filter: { metadata: { _json: { _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'blue' } }] } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			// color='red': Alpha; level>7: Gamma(8)
			description: '_or: returns items matching either of two different paths',
			filter: { metadata: { _json: { _or: [{ color: { _eq: 'red' } }, { level: { _gt: 7 } }] } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// color='red': Alpha; brand='BrandY': Beta; level>7: Gamma
			description: '_or: unions three branches across different paths',
			filter: {
				metadata: {
					_json: { _or: [{ color: { _eq: 'red' } }, { brand: { _eq: 'BrandY' } }, { level: { _gt: 7 } }] },
				},
			},
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			// color='red' AND brand='BrandX': only Alpha satisfies both
			description: '_and: explicit AND semantics matches both conditions',
			filter: { metadata: { _json: { _and: [{ color: { _eq: 'red' } }, { brand: { _eq: 'BrandX' } }] } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			// _and with 3 conditions: brand starts 'Brand' AND level<=5 AND color!='yellow'
			// brand starts 'Brand': Alpha, Beta, Gamma, Delta; level<=5: Alpha(2), Beta(5), Delta(3)
			// color != 'yellow': excludes Delta → Alpha, Beta
			description: '_and: narrows result with three conditions across different paths',
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
			// brand='BrandX' (implicit AND) + (color='red' OR color='green')
			// brand='BrandX': Alpha, Gamma; then (red OR green): Alpha(red), Gamma(green) → both qualify
			description: '_or sibling to a regular path condition combines as AND',
			filter: {
				metadata: {
					_json: { brand: { _eq: 'BrandX' }, _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'green' } }] },
				},
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// (color='red' AND level<5) OR brand='BrandY'
			// color='red' AND level<5: Alpha(red,2) → Alpha
			// brand='BrandY': Beta
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
			// _and containing _or: (color='red' OR color='blue') AND level<=5
			// (red OR blue): Alpha, Beta; level<=5: Alpha(2), Beta(5), Delta(3) → intersection: Alpha, Beta
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
	],
	'Multiple operators in single _json': [
		{
			// Both conditions must hold: only Alpha is red AND has a brand
			description: 'two path conditions in one _json object both must match (AND semantics)',
			filter: { metadata: { _json: { color: { _eq: 'red' }, brand: { _nnull: true } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			// brand starts with 'Brand': Alpha, Beta, Gamma, Delta
			// level ≤ 3: Alpha(2), Delta(3)
			// color ≠ 'black': Epsilon excluded (also lacks brand/level)
			// Intersection: Alpha, Delta
			description: 'three path conditions in one _json object narrow result set',
			filter: {
				metadata: { _json: { brand: { _starts_with: 'Brand' }, level: { _lte: 3 }, color: { _neq: 'black' } } },
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Delta'],
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
				_or: [{ metadata: { _json: { color: { _eq: 'red' } } } }, { metadata: { _json: { color: { _eq: 'blue' } } } }],
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			// level > 1: Alpha(2), Beta(5), Gamma(8), Delta(3)
			// color ≠ 'black': excludes Epsilon
			// brand = 'BrandX': Alpha, Gamma
			// Intersection: Alpha, Gamma
			description: '_and with three separate _json conditions',
			filter: {
				_and: [
					{ metadata: { _json: { level: { _gt: 1 } } } },
					{ metadata: { _json: { color: { _neq: 'black' } } } },
					{ metadata: { _json: { brand: { _eq: 'BrandX' } } } },
				],
			},
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// color='red': Alpha; level>7: Gamma(8); brand='BrandY': Beta
			description: '_or with three separate _json conditions',
			filter: {
				_or: [
					{ metadata: { _json: { color: { _eq: 'red' } } } },
					{ metadata: { _json: { level: { _gt: 7 } } } },
					{ metadata: { _json: { brand: { _eq: 'BrandY' } } } },
				],
			},
			expectedLength: 3,
			expectedNames: ['Alpha', 'Beta', 'Gamma'],
		},
		{
			// (color='red' OR color='blue') AND level≤5 → Alpha(red,2) and Beta(blue,5)
			description: 'nested _and containing _or',
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
			// brand starts with 'Brand': Alpha, Beta, Gamma, Delta; name ≠ 'Alpha': Beta, Gamma, Delta
			description: '_and mixing _json filter with regular field filter',
			filter: {
				_and: [{ metadata: { _json: { brand: { _starts_with: 'Brand' } } } }, { name: { _neq: 'Alpha' } }],
			},
			expectedLength: 3,
			expectedNames: ['Beta', 'Gamma', 'Delta'],
		},
		{
			// level > 6: Gamma(8); name = 'Delta': Delta
			description: '_or mixing _json filter with regular field filter',
			filter: {
				_or: [{ metadata: { _json: { level: { _gt: 6 } } } }, { name: { _eq: 'Delta' } }],
			},
			expectedLength: 2,
			expectedNames: ['Gamma', 'Delta'],
		},
	],
	'Relational M2O filter': [
		{
			// Tech category has metadata.color='blue'; Alpha and Gamma belong to Tech
			description: 'filters products by JSON field on related M2O category',
			filter: { category_id: { metadata: { _json: { color: { _eq: 'blue' } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
	],
	'Relational O2M filter': [
		{
			// Tech has Alpha(red) and Gamma(green); Sports has Beta(blue); Home has Delta(yellow)
			// color='red' only in Tech
			description: 'filters categories where any product has matching json color (O2M)',
			filter: { products: { metadata: { _json: { color: { _eq: 'red' } } } } },
			expectedLength: 1,
			expectedNames: ['Tech'],
			targetCollection: 'categories',
		},
		{
			// level>4: Gamma(8)∈Tech, Beta(5)∈Sports → Tech and Sports
			description: 'filters categories where any product has json level above threshold (O2M)',
			filter: { products: { metadata: { _json: { level: { _gt: 4 } } } } },
			expectedLength: 2,
			expectedNames: ['Sports', 'Tech'],
			targetCollection: 'categories',
		},
		{
			// brand='BrandX': Alpha(Tech), Gamma(Tech) → only Tech category
			description: 'filters categories where any product has matching json brand (O2M)',
			filter: { products: { metadata: { _json: { brand: { _eq: 'BrandX' } } } } },
			expectedLength: 1,
			expectedNames: ['Tech'],
			targetCollection: 'categories',
		},
	],
	'Relational M2M filter': [
		{
			// Alpha→Supplier A(EU), Beta→Supplier A(EU)+Supplier B(US), Gamma→Supplier B(US)
			// region='EU': Alpha and Beta
			description: 'filters products where any linked supplier has matching json region (M2M)',
			filter: { suppliers: { [`${localCollectionSuppliers}_id`]: { metadata: { _json: { region: { _eq: 'EU' } } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Beta'],
		},
		{
			// tier>1: Supplier B(tier=2) → Beta and Gamma
			description: 'filters products where any linked supplier has json tier above threshold (M2M)',
			filter: { suppliers: { [`${localCollectionSuppliers}_id`]: { metadata: { _json: { tier: { _gt: 1 } } } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
		{
			// region='US': Supplier B → Beta and Gamma
			description: 'filters products where any linked supplier is in US region (M2M)',
			filter: { suppliers: { [`${localCollectionSuppliers}_id`]: { metadata: { _json: { region: { _eq: 'US' } } } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Gamma'],
		},
	],
	'Relational _some/_none filter': [
		{
			// Gamma(level=8)∈Tech → Tech is the only category with a product having level>6
			description: '_some: categories where at least one product has json level above threshold',
			filter: { products: { _some: { metadata: { _json: { level: { _gt: 6 } } } } } },
			expectedLength: 1,
			expectedNames: ['Tech'],
			targetCollection: 'categories',
		},
		{
			// Tech excluded (Gamma=8>6); Sports(Beta=5) and Home(Delta=3) have no product with level>6
			description: '_none: categories where no product has json level above threshold',
			filter: { products: { _none: { metadata: { _json: { level: { _gt: 6 } } } } } },
			expectedLength: 2,
			expectedNames: ['Home', 'Sports'],
			targetCollection: 'categories',
		},
		{
			// brand='BrandX': Alpha and Gamma, both in Tech → Tech is the only category
			description: '_some: categories where at least one product has matching json brand',
			filter: { products: { _some: { metadata: { _json: { brand: { _eq: 'BrandX' } } } } } },
			expectedLength: 1,
			expectedNames: ['Tech'],
			targetCollection: 'categories',
		},
		{
			// Epsilon(black) has no category, so none of the 3 categories have a black product
			description: '_none: categories where no product has json color black',
			filter: { products: { _none: { metadata: { _json: { color: { _eq: 'black' } } } } } },
			expectedLength: 3,
			expectedNames: ['Home', 'Sports', 'Tech'],
			targetCollection: 'categories',
		},
	],
	'Boundary and zero-result filters': [
		{
			description: 'filter matching no items returns empty result set',
			// no product has color = purple
			filter: { metadata: { _json: { color: { _eq: 'purple' } } } },
			expectedLength: 0,
		},
		{
			description: '_in with single-element array behaves like _eq',
			filter: { metadata: { _json: { color: { _in: ['red'] } } } },
			expectedLength: 1,
			expectedNames: ['Alpha'],
		},
		{
			description: '_nin with single-element array behaves like _neq',
			// all items except Alpha(red); Epsilon(black) is included since it has a color
			filter: { metadata: { _json: { color: { _nin: ['red'] } } } },
			expectedLength: 4,
			expectedNames: ['Beta', 'Gamma', 'Delta', 'Epsilon'],
		},
		{
			description: '_between with equal min and max matches only the exact value',
			// level values: Alpha=2, Beta=5, Gamma=8, Delta=3; only Beta has level=5
			filter: { metadata: { _json: { level: { _between: [5, 5] } } } },
			expectedLength: 1,
			expectedNames: ['Beta'],
		},
		{
			description: '_nbetween with equal min and max excludes only the exact value',
			// outside [5,5]: Alpha(2), Gamma(8), Delta(3); Epsilon has no level
			filter: { metadata: { _json: { level: { _nbetween: [5, 5] } } } },
			expectedLength: 3,
			expectedNames: ['Alpha', 'Gamma', 'Delta'],
		},
	],
	'Multi-level relational nesting': [
		{
			// Tech→Tech Department(sector:'technology'); Alpha and Gamma are in Tech
			description: '2-level M2O nesting: filters products by grandparent department json sector',
			filter: { category_id: { department_id: { metadata: { _json: { sector: { _eq: 'technology' } } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// Tech Dept has budget=100 (≥75); Alpha and Gamma are in Tech
			// Sports and Home → Consumer Dept (budget=50, not ≥75)
			description: '2-level M2O nesting: filters products by department json budget threshold',
			filter: { category_id: { department_id: { metadata: { _json: { budget: { _gte: 75 } } } } } },
			expectedLength: 2,
			expectedNames: ['Alpha', 'Gamma'],
		},
		{
			// Consumer Dept has budget=50 (<75); Beta(Sports) and Delta(Home) are in Consumer Dept categories
			description: '2-level M2O nesting: filters products by department json budget below threshold',
			filter: { category_id: { department_id: { metadata: { _json: { budget: { _lt: 75 } } } } } },
			expectedLength: 2,
			expectedNames: ['Beta', 'Delta'],
		},
		{
			// categories→products(O2M)→suppliers(M2M): region='EU'
			// Tech: Alpha→Supplier A(EU) → Tech included
			// Sports: Beta→Supplier A(EU) → Sports included
			// Home: Delta→no suppliers → Home excluded
			description: '2-level O2M→M2M nesting: filters categories by products with EU suppliers',
			filter: {
				products: {
					suppliers: { [`${localCollectionSuppliers}_id`]: { metadata: { _json: { region: { _eq: 'EU' } } } } },
				},
			},
			expectedLength: 2,
			expectedNames: ['Sports', 'Tech'],
			targetCollection: 'categories',
		},
	],
});

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
	{
		description: 'returns 400 when _or inside _json is not an array',
		// _or value must be an array, not an object
		filter: { metadata: { _json: { _or: { color: { _eq: 'red' } } } } },
	},
	{
		description: 'returns 400 when _and inside _json is not an array',
		// _and value must be an array, not an object
		filter: { metadata: { _json: { _and: { color: { _eq: 'red' } } } } },
	},

	// Unsupported path characters
	{
		description: 'returns 400 for $ root reference in JSON path',
		// JSONPath $ root is not a supported expression
		filter: { metadata: { _json: { '$.color': { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 for @ current-node reference in JSON path',
		// JSONPath filter @.key is not supported
		filter: { metadata: { _json: { '@.color': { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 for ? filter expression in JSON path',
		// JSONPath filter expression ?(…) is not supported
		filter: { metadata: { _json: { '?(color)': { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 for empty bracket subscript [] in JSON path',
		// [] with no index is not a valid path segment
		filter: { metadata: { _json: { 'items[]': { _eq: 'val' } } } },
	},
	{
		description: 'returns 400 for empty string JSON path key',
		// path keys must be non-empty strings
		filter: { metadata: { _json: { '': { _eq: 'val' } } } },
	},

	// Invalid operator usages inside _json
	{
		description: 'returns 400 when _in inside _json receives a string instead of an array',
		filter: { metadata: { _json: { color: { _in: 'red' } } } },
	},
	{
		description: 'returns 400 when _in inside _json receives an empty array',
		filter: { metadata: { _json: { color: { _in: [] } } } },
	},
	{
		description: 'returns 400 when _nin inside _json receives an empty array',
		filter: { metadata: { _json: { color: { _nin: [] } } } },
	},
	{
		description: 'returns 400 when _between inside _json receives a non-array value',
		filter: { metadata: { _json: { level: { _between: 5 } } } },
	},
	{
		description: 'returns 400 when _between inside _json receives an empty array',
		filter: { metadata: { _json: { level: { _between: [] } } } },
	},
	{
		description: 'returns 400 when _null inside _json receives a non-boolean value',
		// _null must be a boolean
		filter: { metadata: { _json: { color: { _null: 'yes' } } } },
	},
	{
		description: 'returns 400 when _nnull inside _json receives a non-boolean value',
		filter: { metadata: { _json: { color: { _nnull: 'yes' } } } },
	},
	{
		description: 'returns 400 when _eq inside _json receives an empty string',
		// empty string is not a valid filter primitive; use _empty/_nempty instead
		filter: { metadata: { _json: { color: { _eq: '' } } } },
	},
	{
		description: 'returns 400 when _json value is null instead of an object',
		// null is not a plain object
		filter: { metadata: { _json: null } },
	},
	{
		description: 'returns 400 when _or inside _json contains a null entry',
		// each entry in the _or array must itself be a plain object
		filter: { metadata: { _json: { _or: [null] } } },
	},
];

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionProducts = `${collectionProducts}_${pkType}`;
	const localCollectionCategories = `${collectionCategories}_${pkType}`;
	const localCollectionSuppliers = `${collectionSuppliers}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('_json filter operator', () => {
			for (const [groupName, cases] of Object.entries(getSuccessGroups(localCollectionSuppliers))) {
				describe(groupName, () => {
					describe.each(cases)(
						'$description',
						({ filter, expectedLength, minLength, expectedNames, targetCollection }) => {
							it.each(vendors)('%s', async (vendor) => {
								const collection =
									(
										{
											categories: localCollectionCategories,
											suppliers: localCollectionSuppliers,
										} as Record<string, string>
									)[targetCollection!] ?? localCollectionProducts;

								const response = await request(getUrl(vendor))
									.get(`/items/${collection}`)
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
						},
					);
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
