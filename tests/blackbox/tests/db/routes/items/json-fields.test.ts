import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreateItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionProducts, getTestsSchema, type Product, seedDBValues } from './json-fields.seed';

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
		// Assert
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionProducts = `${collectionProducts}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection', () => {
			describe('retrieves json field with simple path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.color)',
							sort: 'id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionProducts]: {
								__args: {
									sort: 'id',
								},
								id: true,
								name: true,
								metadata_func: {
									color: {
										__aliasFor: 'json',
										__args: {
											path: 'color',
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.length).toBeGreaterThan(0);

					// First product should have color 'red'
					expect(response.body.data[0]).toHaveProperty('metadata_color_json');
					expect(response.body.data[0].metadata_color_json).toBe('red');

					// Second product should have color 'blue'
					expect(response.body.data[1]).toHaveProperty('metadata_color_json');
					expect(response.body.data[1].metadata_color_json).toBe('blue');

					// GraphQL
					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionProducts]).toBeDefined();
					expect(gqlResponse.body.data[localCollectionProducts][0]).toHaveProperty('metadata_func');
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func.color).toBe('red');
				});
			});

			describe('retrieves json field with nested object path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.dimensions.width),json(metadata.dimensions.height)',
							sort: 'id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionProducts]: {
								__args: {
									sort: 'id',
								},
								id: true,
								name: true,
								metadata_func: {
									width: {
										__aliasFor: 'json',
										__args: {
											path: 'dimensions.width',
										},
									},
									height: {
										__aliasFor: 'json',
										__args: {
											path: 'dimensions.height',
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					// First product dimensions: width: 10, height: 20
					expect(response.body.data[0]).toHaveProperty('metadata_dimensions_width_json');
					expect(response.body.data[0]).toHaveProperty('metadata_dimensions_height_json');

					// Note: JSON extraction returns strings in some databases, numbers in others
					// We'll accept either type
					const width = response.body.data[0].metadata_dimensions_width_json;
					const height = response.body.data[0].metadata_dimensions_height_json;

					expect(Number(width)).toBe(10);
					expect(Number(height)).toBe(20);

					// GraphQL
					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func).toHaveProperty('width');
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func).toHaveProperty('height');
				});
			});

			describe('retrieves json field with array index path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.tags[0]),json(metadata.tags[1])',
							sort: 'id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionProducts]: {
								__args: {
									sort: 'id',
								},
								id: true,
								name: true,
								metadata_func: {
									tag0: {
										__aliasFor: 'json',
										__args: {
											path: 'tags[0]',
										},
									},
									tag1: {
										__aliasFor: 'json',
										__args: {
											path: 'tags[1]',
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					// First product tags: ['electronics', 'premium', 'new']
					expect(response.body.data[0]).toHaveProperty('metadata_tags_0_json');
					expect(response.body.data[0]).toHaveProperty('metadata_tags_1_json');
					expect(response.body.data[0].metadata_tags_0_json).toBe('electronics');
					expect(response.body.data[0].metadata_tags_1_json).toBe('premium');

					// GraphQL
					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func.tag0).toBe('electronics');
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func.tag1).toBe('premium');
				});
			});

			describe('retrieves json field with nested array and object path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.variants[0].sku),json(metadata.variants[0].price)',
							sort: 'id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionProducts]: {
								__args: {
									sort: 'id',
								},
								id: true,
								name: true,
								metadata_func: {
									sku: {
										__aliasFor: 'json',
										__args: {
											path: 'variants[0].sku',
										},
									},
									price: {
										__aliasFor: 'json',
										__args: {
											path: 'variants[0].price',
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					// First product first variant: { sku: 'SKU-001', price: 99.99, available: true }
					expect(response.body.data[0]).toHaveProperty('metadata_variants_0_sku_json');
					expect(response.body.data[0]).toHaveProperty('metadata_variants_0_price_json');
					expect(response.body.data[0].metadata_variants_0_sku_json).toBe('SKU-001');

					const price = response.body.data[0].metadata_variants_0_price_json;
					expect(Number(price)).toBeCloseTo(99.99, 2);

					// GraphQL
					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func.sku).toBe('SKU-001');
				});
			});

			describe('retrieves multiple json extractions from different fields', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,json(metadata.color),json(settings.theme)',
							sort: 'id',
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data[0]).toHaveProperty('metadata_color_json');
					expect(response.body.data[0]).toHaveProperty('settings_theme_json');
					expect(response.body.data[0].metadata_color_json).toBe('red');
					expect(response.body.data[0].settings_theme_json).toBe('dark');
				});
			});

			describe('handles null and missing values gracefully', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - request the last product which has missing fields
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,json(metadata.brand),json(metadata.dimensions.width),json(settings.theme)',
							sort: '-id',
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					// Last product has no brand, no dimensions, and null settings
					const item = response.body.data[0];
					expect(item).toHaveProperty('metadata_brand_json');
					expect(item.metadata_brand_json).toBeNull();

					expect(item).toHaveProperty('metadata_dimensions_width_json');
					expect(item.metadata_dimensions_width_json).toBeNull();

					expect(item).toHaveProperty('settings_theme_json');
					expect(item.settings_theme_json).toBeNull();
				});
			});

			describe('handles empty arrays', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - third product has empty variants array
					const products = vendorSchemaValues[vendor][localCollectionProducts].id;
					const thirdProductId = products[2];

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}/${thirdProductId}`)
						.query({
							fields: 'id,json(metadata.variants[0].sku)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveProperty('metadata_variants_0_sku_json');
					expect(response.body.data.metadata_variants_0_sku_json).toBeNull();
				});
			});

			describe('combines json extraction with regular fields', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,metadata,json(metadata.color),json(metadata.brand)',
							sort: 'id',
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					const item = response.body.data[0];

					// Should have both the full metadata object and extracted values
					expect(item).toHaveProperty('id');
					expect(item).toHaveProperty('name');
					expect(item).toHaveProperty('metadata');
					expect(item).toHaveProperty('metadata_color_json');
					expect(item).toHaveProperty('metadata_brand_json');

					expect(item.metadata).toBeTypeOf('object');
					expect(item.metadata.color).toBe('red');
					expect(item.metadata_color_json).toBe('red');
					expect(item.metadata_brand_json).toBe('BrandX');
				});
			});

			describe('works with filters', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - filter by name and extract json
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.color)',
							filter: JSON.stringify({ name: { _eq: 'Product A' } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveLength(1);
					expect(response.body.data[0].name).toBe('Product A');
					expect(response.body.data[0].metadata_color_json).toBe('red');
				});
			});

			describe('works with sorting', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.color)',
							sort: '-id',
							limit: 2,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveLength(2);

					// Results should be in descending order
					const firstId = response.body.data[0].id;
					const secondId = response.body.data[1].id;

					if (pkType === 'string') {
						expect(firstId > secondId).toBe(true);
					} else {
						expect(Number(firstId) > Number(secondId)).toBe(true);
					}
				});
			});

			describe('works with pagination', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,json(metadata.color)',
							sort: 'id',
							limit: 2,
							offset: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveLength(2);

					// Second product should be first in results (offset 1)
					expect(response.body.data[0].metadata_color_json).toBe('blue');
				});
			});
		});

		describe('GET /:collection/:id', () => {
			describe('retrieves single item with json extraction', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const products = vendorSchemaValues[vendor][localCollectionProducts].id;
					const firstProductId = products[0];

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}/${firstProductId}`)
						.query({
							fields: 'id,name,json(metadata.color),json(metadata.brand)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionProducts]: {
								__args: {
									filter: {
										id: {
											_eq: firstProductId,
										},
									},
								},
								id: true,
								name: true,
								metadata_func: {
									color: {
										__aliasFor: 'json',
										__args: {
											path: 'color',
										},
									},
									brand: {
										__aliasFor: 'json',
										__args: {
											path: 'brand',
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.id).toBe(firstProductId);
					expect(response.body.data.metadata_color_json).toBe('red');
					expect(response.body.data.metadata_brand_json).toBe('BrandX');

					// GraphQL
					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func.color).toBe('red');
					expect(gqlResponse.body.data[localCollectionProducts][0].metadata_func.brand).toBe('BrandX');
				});
			});
		});

		describe('Error handling', () => {
			describe('returns error for non-json field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - try to use json() on a string field
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,json(name.invalid)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('returns error for non-existent field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,json(nonexistent.path)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('returns error for invalid json function syntax', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - missing path after field
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,json(metadata)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});
		});

		describe('POST /:collection', () => {
			describe('can create item and extract json in same request', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const newProduct: Product = {
						name: 'New Product ' + randomUUID(),
						metadata: {
							color: 'purple',
							brand: 'TestBrand',
							dimensions: { width: 5, height: 10, depth: 3 },
							tags: ['test'],
							variants: [],
						},
					};

					if (pkType === 'string') {
						newProduct.id = 'product-' + randomUUID();
					}

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata.color),json(metadata.brand)',
						})
						.send(newProduct)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.name).toBe(newProduct.name);
					expect(response.body.data.metadata_color_json).toBe('purple');
					expect(response.body.data.metadata_brand_json).toBe('TestBrand');
				});
			});
		});

		describe('PATCH /:collection/:id', () => {
			describe('can update item and extract json in same request', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const product: Product = {
						name: 'Update Test ' + randomUUID(),
						metadata: {
							color: 'orange',
							brand: 'OldBrand',
						},
					};

					if (pkType === 'string') {
						product.id = 'product-' + randomUUID();
					}

					const created = await CreateItem(vendor, {
						collection: localCollectionProducts,
						item: product,
					});

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionProducts}/${created.id}`)
						.query({
							fields: 'id,json(metadata.color),json(metadata.brand)',
						})
						.send({
							metadata: {
								color: 'orange',
								brand: 'NewBrand',
							},
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.metadata_color_json).toBe('orange');
					expect(response.body.data.metadata_brand_json).toBe('NewBrand');
				});
			});
		});
	});
});
