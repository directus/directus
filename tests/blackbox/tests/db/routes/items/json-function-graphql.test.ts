/**
 * Blackbox tests for Phase 3: json() field function exposed in GraphQL.
 *
 * The `json` sub-field inside `{field}_func` accepts a required `path`
 * argument and returns the extracted JSON value. The resolver maps:
 *
 *   metadata_func { json(path: "color") }  →  fields: ["json(metadata, color)"]
 *                                           →  result key: metadata_color_json
 *
 * Path values are plain GraphQL string arguments so dots, brackets, etc. are
 * all valid — they only appear inside a string literal, not as an identifier.
 *
 * Multiple paths from the same json field can be requested in a single
 * `{field}_func` selection using field aliases on the `json` sub-field.
 *
 * These tests reuse the seed data from json-function.seed.ts:
 *   Alpha – metadata.color:'red',   dimensions.width:10, tags[0]:'electronics'
 *   Beta  – metadata.color:'blue',  dimensions.width:15
 *   Gamma – metadata.color:'green'
 *   Zeta  – metadata.color:'black', no dimensions
 */
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionProducts, getTestsSchema, seedDBValues } from './json-function-graphql.seed';

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

describe.each(PRIMARY_KEY_TYPES)('/graphql json() field function', (pkType) => {
	const localCollectionProducts = `${collectionProducts}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		// -----------------------------------------------------------------------
		// Simple path extraction
		// -----------------------------------------------------------------------

		describe('simple path', () => {
			it.each(vendors)('%s: returns scalar value at top-level path', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'] },
							name: true,
							metadata_func: {
								json: { __args: { path: 'color' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { json: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				expect(data.length).toBeGreaterThan(0);

				// Sorted by name: Alpha first
				expect(data[0]!.name).toBe('Alpha');
				expect(data[0]!.metadata_func.json).toBe('red');

				expect(data[1]!.name).toBe('Beta');
				expect(data[1]!.metadata_func.json).toBe('blue');
			});
		});

		// -----------------------------------------------------------------------
		// Nested object path (dot notation inside string arg)
		// -----------------------------------------------------------------------

		describe('nested path', () => {
			it.each(vendors)('%s: returns value at nested dot-path', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'], limit: 2 },
							name: true,
							metadata_func: {
								width: { __aliasFor: 'json', __args: { path: 'dimensions.width' } },
								height: { __aliasFor: 'json', __args: { path: 'dimensions.height' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { width: unknown; height: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Alpha: dimensions.width=10, dimensions.height=20
				expect(data[0]!.name).toBe('Alpha');
				expect(Number(data[0]!.metadata_func.width)).toBe(10);
				expect(Number(data[0]!.metadata_func.height)).toBe(20);
			});
		});

		// -----------------------------------------------------------------------
		// Array index path
		// -----------------------------------------------------------------------

		describe('array index path', () => {
			it.each(vendors)('%s: returns element at array index path', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'], limit: 1 },
							name: true,
							metadata_func: {
								firstTag: { __aliasFor: 'json', __args: { path: 'tags[0]' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { firstTag: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Alpha tags[0] = 'electronics'
				expect(data[0]!.name).toBe('Alpha');
				expect(data[0]!.metadata_func.firstTag).toBe('electronics');
			});
		});

		// -----------------------------------------------------------------------
		// Multiple aliases from the same json field
		// -----------------------------------------------------------------------

		describe('multiple aliases from same json field', () => {
			it.each(vendors)('%s: returns different paths aliased from the same field', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'], limit: 1 },
							name: true,
							metadata_func: {
								color: { __aliasFor: 'json', __args: { path: 'color' } },
								brand: { __aliasFor: 'json', __args: { path: 'brand' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { color: unknown; brand: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Alpha: color='red', brand='BrandX'
				expect(data[0]!.name).toBe('Alpha');
				expect(data[0]!.metadata_func.color).toBe('red');
				expect(data[0]!.metadata_func.brand).toBe('BrandX');
			});
		});

		// -----------------------------------------------------------------------
		// Nested object path returns parsed JSON value (not a string)
		// -----------------------------------------------------------------------

		describe('object path returns parsed value', () => {
			it.each(vendors)('%s: returns nested object as parsed JSON', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'], limit: 1 },
							name: true,
							metadata_func: {
								dimensions: { __aliasFor: 'json', __args: { path: 'dimensions' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { dimensions: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Alpha dimensions = { width: 10, height: 20, depth: 5 }
				expect(data[0]!.name).toBe('Alpha');
				expect(data[0]!.metadata_func.dimensions).toEqual({ width: 10, height: 20, depth: 5 });
			});

			it.each(vendors)('%s: returns top-level array as parsed JSON', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'], limit: 1 },
							name: true,
							metadata_func: {
								tags: { __aliasFor: 'json', __args: { path: 'tags' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { tags: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Alpha tags = ['electronics', 'premium', 'new']
				expect(data[0]!.name).toBe('Alpha');
				expect(Array.isArray(data[0]!.metadata_func.tags)).toBe(true);
				expect(data[0]!.metadata_func.tags).toEqual(['electronics', 'premium', 'new']);
			});
		});

		// -----------------------------------------------------------------------
		// Multiple json fields in one query
		// -----------------------------------------------------------------------

		describe('multiple json fields', () => {
			it.each(vendors)('%s: extracts from two different json fields in one query', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'], limit: 1 },
							name: true,
							metadata_func: {
								json: { __args: { path: 'color' } },
							},
							settings_func: {
								json: { __args: { path: 'theme' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { json: unknown }; settings_func: { json: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Alpha: metadata.color='red', settings.theme='dark'
				expect(data[0]!.name).toBe('Alpha');
				expect(data[0]!.metadata_func.json).toBe('red');
				expect(data[0]!.settings_func.json).toBe('dark');
			});
		});

		// -----------------------------------------------------------------------
		// Null path result (item missing the key)
		// -----------------------------------------------------------------------

		describe('missing path key', () => {
			it.each(vendors)('%s: returns null when path key is absent', async (vendor) => {
				const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
					query: {
						[localCollectionProducts]: {
							__args: { sort: ['name'] },
							name: true,
							metadata_func: {
								width: { __aliasFor: 'json', __args: { path: 'dimensions.width' } },
							},
						},
					},
				});

				expect(gqlResponse.statusCode).toEqual(200);
				expect(gqlResponse.body.errors).toBeUndefined();

				const data: Array<{ name: string; metadata_func: { width: unknown } }> =
					gqlResponse.body.data[localCollectionProducts];

				// Zeta has no dimensions — last alphabetically
				const zeta = data.find((item) => item.name === 'Zeta');
				expect(zeta).toBeDefined();
				expect(zeta!.metadata_func.width).toBeNull();
			});
		});

		// -----------------------------------------------------------------------
		// Schema error: missing required path argument
		// -----------------------------------------------------------------------

		describe('schema validation', () => {
			it.each(vendors)('%s: returns schema error when path argument is absent', async (vendor) => {
				// Construct the invalid query by sending raw GQL — can't omit a required
				// arg via requestGraphQL's json builder, so use supertest directly.
				const gqlResponse = await request(getUrl(vendor))
					.post('/graphql')
					.send({
						query: `{ ${localCollectionProducts} { metadata_func { json } } }`,
					})
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// GraphQL should reject the query at the schema-validation layer
				expect(gqlResponse.body.errors).toBeDefined();
				expect(gqlResponse.body.errors.length).toBeGreaterThan(0);
			});
		});
	});
});
