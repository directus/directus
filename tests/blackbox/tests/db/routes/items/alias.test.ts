import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionProducts, getTestsSchema, type Product, seedDBValues } from './alias.seed';

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

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionProducts = `${collectionProducts}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection', () => {
			describe('json() aliasing', () => {
				describe('uses custom alias for simple json path', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_color',
								alias: JSON.stringify({ my_color: 'json(metadata, color)' }),
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();
						expect(response.body.data.length).toBeGreaterThan(0);

						// Response key must be the alias, not the auto-generated name
						expect(response.body.data[0]).toHaveProperty('my_color');
						expect(response.body.data[0]).not.toHaveProperty('metadata_color_json');

						// Alpha (sorted first) has color 'red'
						expect(response.body.data[0].my_color).toBe('red');
						// Beta has color 'blue'
						expect(response.body.data[1].my_color).toBe('blue');
					});
				});

				describe('uses custom alias for nested json path', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,width,height',
								alias: JSON.stringify({
									width: 'json(metadata, dimensions.width)',
									height: 'json(metadata, dimensions.height)',
								}),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						const item = response.body.data[0];
						expect(item).toHaveProperty('width');
						expect(item).toHaveProperty('height');
						expect(item).not.toHaveProperty('metadata_dimensions_width_json');

						// Alpha: dimensions.width = 10, dimensions.height = 20
						expect(Number(item.width)).toBe(10);
						expect(Number(item.height)).toBe(20);
					});
				});

				describe('uses custom alias for array index path', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,first_tag',
								alias: JSON.stringify({ first_tag: 'json(metadata, tags[0])' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						const item = response.body.data[0];
						expect(item).toHaveProperty('first_tag');
						expect(item).not.toHaveProperty('metadata_tags_0_json');

						// Alpha: tags[0] = 'electronics'
						expect(item.first_tag).toBe('electronics');
					});
				});

				describe('uses custom alias for deeply nested path (array element + property)', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,first_sku',
								alias: JSON.stringify({ first_sku: 'json(metadata, variants[0].sku)' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item).toHaveProperty('first_sku');
						expect(item).not.toHaveProperty('metadata_variants_0_sku_json');

						// Alpha: variants[0].sku = 'SKU-001'
						expect(item.first_sku).toBe('SKU-001');
					});
				});

				describe('supports multiple json() aliases in one request', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,color,brand,theme',
								alias: JSON.stringify({
									color: 'json(metadata, color)',
									brand: 'json(metadata, brand)',
									theme: 'json(settings, theme)',
								}),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item).toHaveProperty('color');
						expect(item).toHaveProperty('brand');
						expect(item).toHaveProperty('theme');

						// Alpha
						expect(item.color).toBe('red');
						expect(item.brand).toBe('BrandX');
						expect(item.theme).toBe('dark');
					});
				});

				describe('json alias can be combined with regular fields', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,metadata,color',
								alias: JSON.stringify({ color: 'json(metadata, color)' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item).toHaveProperty('id');
						expect(item).toHaveProperty('name');
						expect(item).toHaveProperty('metadata');
						expect(item).toHaveProperty('color');

						// Full metadata object and extracted alias both present
						expect(item.metadata.color).toBe('red');
						expect(item.color).toBe('red');
					});
				});

				describe('json alias returns null for missing path', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action — Zeta (last sorted) has no brand or dimensions
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_brand,my_width',
								alias: JSON.stringify({
									my_brand: 'json(metadata, brand)',
									my_width: 'json(metadata, dimensions.width)',
								}),
								sort: '-name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item.my_brand).toBeNull();
						expect(item.my_width).toBeNull();
					});
				});

				describe('json alias returns parsed object, not string', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,dims',
								alias: JSON.stringify({ dims: 'json(metadata, dimensions)' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(typeof item.dims).toBe('object');
						expect(item.dims).toEqual({ width: 10, height: 20 });
					});
				});
			});

			describe('regular field aliasing', () => {
				describe('uses custom alias for a simple field', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,label',
								alias: JSON.stringify({ label: 'name' }),
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						// Response uses alias key, not original field name
						expect(response.body.data[0]).toHaveProperty('label');
						expect(response.body.data[0]).not.toHaveProperty('name');

						// Alpha is sorted first
						expect(response.body.data[0].label).toBe('Alpha');
					});
				});

				describe('supports multiple field aliases', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,label,json_data',
								alias: JSON.stringify({
									label: 'name',
									json_data: 'metadata',
								}),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item).toHaveProperty('label');
						expect(item).toHaveProperty('json_data');
						expect(item).not.toHaveProperty('name');
						expect(item).not.toHaveProperty('metadata');

						expect(item.label).toBe('Alpha');
						expect(item.json_data.color).toBe('red');
					});
				});

				describe('field alias is included when using wildcard fields', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action — ?fields=* should expand to include alias keys
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: '*,label',
								alias: JSON.stringify({ label: 'name' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						// Both the original field and the alias should be present
						expect(item).toHaveProperty('name');
						expect(item).toHaveProperty('label');
						expect(item.label).toBe(item.name);
					});
				});
			});
		});

		describe('GET /:collection/:id', () => {
			describe('json alias works on single item endpoint', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup — get Alpha's ID
					const listResponse = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({ fields: 'id', sort: 'name', limit: 1 })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const firstId = listResponse.body.data[0].id;

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}/${firstId}`)
						.query({
							fields: 'id,color,brand',
							alias: JSON.stringify({
								color: 'json(metadata, color)',
								brand: 'json(metadata, brand)',
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.id).toBe(firstId);
					expect(response.body.data.color).toBe('red');
					expect(response.body.data.brand).toBe('BrandX');
				});
			});
		});

		describe('POST /:collection', () => {
			describe('json alias works on create response', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const newProduct: Product = {
						name: 'New Alias Product',
						metadata: { color: 'purple', brand: 'AliasTest' },
					};

					if (pkType === 'string') {
						newProduct.id = `alias-test-${vendor}-${pkType}`;
					}

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,color,brand',
							alias: JSON.stringify({
								color: 'json(metadata, color)',
								brand: 'json(metadata, brand)',
							}),
						})
						.send(newProduct)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.color).toBe('purple');
					expect(response.body.data.brand).toBe('AliasTest');
				});
			});
		});

		describe('Error handling', () => {
			describe('rejects alias key containing a period', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id',
							alias: JSON.stringify({ 'my.key': 'name' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects alias value with a period that is not a json() call', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action — dot-notation relational path as alias value is not allowed
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,label',
							alias: JSON.stringify({ label: 'some.relation' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects json() alias with invalid syntax (missing path)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action — json(field) without comma/path is invalid
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,my_color',
							alias: JSON.stringify({ my_color: 'json(metadata)' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects json() alias on non-json field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action — 'name' is a string field, not json
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,my_val',
							alias: JSON.stringify({ my_val: 'json(name, color)' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});
		});
	});
});
