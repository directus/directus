import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreateItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, test } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionProducts, getTestsSchema, type Product, seedDBValues } from './json-function.seed';

const cachedSchema = PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);

const vendorSchemaValues: TestsSchemaVendorValues = {};

beforeAll(async () => {
	await seedDBValues(cachedSchema, vendorSchemaValues);
}, 300_000);

describe('Seed Database Values', () => {
	test.each(vendors)('%s', async (vendor) => {
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionProducts = `${collectionProducts}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection', () => {
			describe('json() field extraction', () => {
				describe('retrieves json field with simple path', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,json(metadata, color)',
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();
						expect(response.body.data.length).toBeGreaterThan(0);

						// Alpha (first by name) has color 'red'
						expect(response.body.data[0]).toHaveProperty('metadata_color_json');
						expect(response.body.data[0].metadata_color_json).toBe('red');

						// Beta has color 'blue'
						expect(response.body.data[1]).toHaveProperty('metadata_color_json');
						expect(response.body.data[1].metadata_color_json).toBe('blue');
					});
				});

				describe('retrieves json field with nested object path', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,json(metadata, dimensions.width),json(metadata, dimensions.height)',
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						// Alpha: dimensions.width=10, dimensions.height=20
						expect(response.body.data[0]).toHaveProperty('metadata_dimensions_width_json');
						expect(response.body.data[0]).toHaveProperty('metadata_dimensions_height_json');

						// JSON extraction returns strings in some databases, numbers in others
						expect(Number(response.body.data[0].metadata_dimensions_width_json)).toBe(10);
						expect(Number(response.body.data[0].metadata_dimensions_height_json)).toBe(20);
					});
				});

				describe('retrieves json field with array index path', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,json(metadata, tags[0]),json(metadata, tags[1])',
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						// Alpha tags: ['electronics', 'premium', 'new']
						expect(response.body.data[0]).toHaveProperty('metadata_tags_0_json');
						expect(response.body.data[0]).toHaveProperty('metadata_tags_1_json');
						expect(response.body.data[0].metadata_tags_0_json).toBe('electronics');
						expect(response.body.data[0].metadata_tags_1_json).toBe('premium');
					});
				});

				describe('retrieves json field with nested array and object path', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,json(metadata, variants[0].sku),json(metadata, variants[0].price)',
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						// Alpha first variant: { sku: 'SKU-001', price: 99.99, available: true }
						expect(response.body.data[0]).toHaveProperty('metadata_variants_0_sku_json');
						expect(response.body.data[0]).toHaveProperty('metadata_variants_0_price_json');
						expect(response.body.data[0].metadata_variants_0_sku_json).toBe('SKU-001');
						expect(Number(response.body.data[0].metadata_variants_0_price_json)).toBeCloseTo(99.99, 2);
					});
				});

				describe('returns nested object as parsed JSON, not as string', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,json(metadata, dimensions)',
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						const dimensions = response.body.data[0].metadata_dimensions_json;

						expect(typeof dimensions).toBe('object');
						expect(dimensions).toEqual({ width: 10, height: 20, depth: 5 });
					});
				});

				describe('returns array as parsed JSON, not as string', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,json(metadata, tags)',
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						const tags = response.body.data[0].metadata_tags_json;

						expect(Array.isArray(tags)).toBe(true);
						expect(tags).toEqual(['electronics', 'premium', 'new']);
					});
				});

				describe('returns nested array of objects as parsed JSON, not as string', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,json(metadata, variants)',
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						const variants = response.body.data[0].metadata_variants_json;

						expect(Array.isArray(variants)).toBe(true);

						expect(variants).toEqual([
							{ sku: 'SKU-001', price: 99.99, available: true },
							{ sku: 'SKU-002', price: 149.99, available: false },
						]);
					});
				});

				describe('retrieves multiple json extractions from different fields', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,json(metadata, color),json(settings, theme)',
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();
						expect(response.body.data[0]).toHaveProperty('metadata_color_json');
						expect(response.body.data[0]).toHaveProperty('settings_theme_json');
						expect(response.body.data[0].metadata_color_json).toBe('red');
						expect(response.body.data[0].settings_theme_json).toBe('dark');
					});
				});

				describe('handles null and missing values gracefully', () => {
					test.each(vendors)('%s', async (vendor) => {
						// Zeta (sort: '-name', limit: 1) has no brand, no dimensions, and null settings
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,json(metadata, brand),json(metadata, dimensions.width),json(settings, theme)',
								sort: '-name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

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
					test.each(vendors)('%s', async (vendor) => {
						// Gamma has an empty variants array
						const listResponse = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id',
								filter: JSON.stringify({ name: { _eq: 'Gamma' } }),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gammaId = listResponse.body.data[0].id;

						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}/${gammaId}`)
							.query({
								fields: 'id,json(metadata, variants[0].sku)',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();
						expect(response.body.data).toHaveProperty('metadata_variants_0_sku_json');
						expect(response.body.data.metadata_variants_0_sku_json).toBeNull();
					});
				});

				describe('combines json extraction with regular fields', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,metadata,json(metadata, color),json(metadata, brand)',
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
			});

			describe('json() aliasing', () => {
				describe('uses custom alias for simple json path', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_color',
								alias: JSON.stringify({ my_color: 'json(metadata, color)' }),
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();
						expect(response.body.data.length).toBeGreaterThan(0);

						// Response key must be the alias, not the auto-generated name
						expect(response.body.data[0]).toHaveProperty('my_color');
						expect(response.body.data[0]).not.toHaveProperty('metadata_color_json');

						// Alpha (sorted first) has color 'red', Beta has 'blue'
						expect(response.body.data[0].my_color).toBe('red');
						expect(response.body.data[1].my_color).toBe('blue');
					});
				});

				describe('uses custom alias for nested json path', () => {
					test.each(vendors)('%s', async (vendor) => {
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

						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toBeDefined();

						const item = response.body.data[0];
						expect(item).toHaveProperty('width');
						expect(item).toHaveProperty('height');
						expect(item).not.toHaveProperty('metadata_dimensions_width_json');

						// Alpha: dimensions.width=10, dimensions.height=20
						expect(Number(item.width)).toBe(10);
						expect(Number(item.height)).toBe(20);
					});
				});

				describe('uses custom alias for array index path', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,first_tag',
								alias: JSON.stringify({ first_tag: 'json(metadata, tags[0])' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,first_sku',
								alias: JSON.stringify({ first_sku: 'json(metadata, variants[0].sku)' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item).toHaveProperty('first_sku');
						expect(item).not.toHaveProperty('metadata_variants_0_sku_json');

						// Alpha: variants[0].sku = 'SKU-001'
						expect(item.first_sku).toBe('SKU-001');
					});
				});

				describe('supports multiple json() aliases in one request', () => {
					test.each(vendors)('%s', async (vendor) => {
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
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,name,metadata,color',
								alias: JSON.stringify({ color: 'json(metadata, color)' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
					test.each(vendors)('%s', async (vendor) => {
						// Zeta (last sorted) has no brand or dimensions
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

						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(item.my_brand).toBeNull();
						expect(item.my_width).toBeNull();
					});
				});

				describe('json alias returns parsed object, not string', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,dims',
								alias: JSON.stringify({ dims: 'json(metadata, dimensions)' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);

						const item = response.body.data[0];
						expect(typeof item.dims).toBe('object');
						// Alpha: dimensions = { width: 10, height: 20, depth: 5 }
						expect(item.dims).toEqual({ width: 10, height: 20, depth: 5 });
					});
				});
			});

			describe('json() sorting', () => {
				describe('sorts asc by direct json() expression', () => {
					test.each(vendors)('%s', async (vendor) => {
						// Colors: black(Zeta) < blue(Beta) < green(Gamma) < red(Alpha)
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_color',
								alias: JSON.stringify({ my_color: 'json(metadata, color)' }),
								sort: 'json(metadata, color)',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(4);
						expect(response.body.data[0].my_color).toBe('black'); // Zeta
						expect(response.body.data[1].my_color).toBe('blue'); // Beta
						expect(response.body.data[2].my_color).toBe('green'); // Gamma
						expect(response.body.data[3].my_color).toBe('red'); // Alpha
					});
				});

				describe('sorts desc by direct json() expression', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_color',
								alias: JSON.stringify({ my_color: 'json(metadata, color)' }),
								sort: '-json(metadata, color)',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(4);
						expect(response.body.data[0].my_color).toBe('red'); // Alpha
						expect(response.body.data[1].my_color).toBe('green'); // Gamma
						expect(response.body.data[2].my_color).toBe('blue'); // Beta
						expect(response.body.data[3].my_color).toBe('black'); // Zeta
					});
				});

				describe('sorts asc by json() alias', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_color',
								alias: JSON.stringify({ my_color: 'json(metadata, color)' }),
								sort: 'my_color',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(4);
						expect(response.body.data[0].my_color).toBe('black'); // Zeta
						expect(response.body.data[1].my_color).toBe('blue'); // Beta
						expect(response.body.data[2].my_color).toBe('green'); // Gamma
						expect(response.body.data[3].my_color).toBe('red'); // Alpha
					});
				});

				describe('sorts desc by json() alias', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,my_color',
								alias: JSON.stringify({ my_color: 'json(metadata, color)' }),
								sort: '-my_color',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(4);
						expect(response.body.data[0].my_color).toBe('red'); // Alpha
						expect(response.body.data[1].my_color).toBe('green'); // Gamma
						expect(response.body.data[2].my_color).toBe('blue'); // Beta
						expect(response.body.data[3].my_color).toBe('black'); // Zeta
					});
				});

				describe('sorts by json() with dotted path', () => {
					test.each(vendors)('%s', async (vendor) => {
						// Widths: Alpha=10, Beta=15, Gamma=12, Zeta=null
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,width',
								alias: JSON.stringify({ width: 'json(metadata, dimensions.width)' }),
								sort: 'json(metadata, dimensions.width)',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(4);

						// Non-null widths should be sorted numerically ascending (null position varies by database)
						const widths = response.body.data
							.map((item: any) => item.width)
							.filter((w: any) => w !== null)
							.map((w: any) => Number(w));

						expect(widths).toEqual([10, 12, 15]);
					});
				});
			});

			describe('regular field aliasing', () => {
				describe('uses custom alias for a simple field', () => {
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: 'id,label',
								alias: JSON.stringify({ label: 'name' }),
								sort: 'name',
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
					test.each(vendors)('%s', async (vendor) => {
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
					test.each(vendors)('%s', async (vendor) => {
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionProducts}`)
							.query({
								fields: '*,label',
								alias: JSON.stringify({ label: 'name' }),
								sort: 'name',
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
	});

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe('retrieves single item with json extraction', () => {
				test.each(vendors)('%s', async (vendor) => {
					// Find Alpha by sorting — first by name
					const listResponse = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({ fields: 'id', sort: 'name', limit: 1 })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const alphaId = listResponse.body.data[0].id;

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}/${alphaId}`)
						.query({
							fields: 'id,name,json(metadata, color),json(metadata, brand)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.id).toBe(alphaId);
					expect(response.body.data.metadata_color_json).toBe('red');
					expect(response.body.data.metadata_brand_json).toBe('BrandX');
				});
			});

			describe('json alias works on single item endpoint', () => {
				test.each(vendors)('%s', async (vendor) => {
					const listResponse = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({ fields: 'id', sort: 'name', limit: 1 })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const alphaId = listResponse.body.data[0].id;

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}/${alphaId}`)
						.query({
							fields: 'id,color,brand',
							alias: JSON.stringify({
								color: 'json(metadata, color)',
								brand: 'json(metadata, brand)',
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(200);
					expect(response.body.data.id).toBe(alphaId);
					expect(response.body.data.color).toBe('red');
					expect(response.body.data.brand).toBe('BrandX');
				});
			});
		});

		describe('Error handling', () => {
			describe('returns error for non-json field', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({ fields: 'id,json(name, invalid)' })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('returns error for non-existent field', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({ fields: 'id,json(nonexistent, path)' })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(403);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('returns error for invalid json function syntax (missing path)', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({ fields: 'id,json(metadata)' })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects alias key containing a period', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id',
							alias: JSON.stringify({ 'my.key': 'name' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects alias value with a period that is not a json() call', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,label',
							alias: JSON.stringify({ label: 'some.relation' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects json() alias with invalid syntax (missing path)', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,my_color',
							alias: JSON.stringify({ my_color: 'json(metadata)' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('rejects json() alias on non-json field', () => {
				test.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,my_val',
							alias: JSON.stringify({ my_val: 'json(name, color)' }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});
		});

		describe('POST /:collection', () => {
			describe('can create item and extract json in same request', () => {
				test.each(vendors)('%s', async (vendor) => {
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

					const response = await request(getUrl(vendor))
						.post(`/items/${localCollectionProducts}`)
						.query({
							fields: 'id,name,json(metadata, color),json(metadata, brand)',
						})
						.send(newProduct)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.name).toBe(newProduct.name);
					expect(response.body.data.metadata_color_json).toBe('purple');
					expect(response.body.data.metadata_brand_json).toBe('TestBrand');
				});
			});

			describe('json alias works on create response', () => {
				test.each(vendors)('%s', async (vendor) => {
					const newProduct: Product = {
						name: 'New Alias Product ' + randomUUID(),
						metadata: { color: 'purple', brand: 'AliasTest' },
					};

					if (pkType === 'string') {
						newProduct.id = `alias-test-${vendor}-${pkType}-${randomUUID()}`;
					}

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

					expect(response.statusCode).toEqual(200);
					expect(response.body.data.color).toBe('purple');
					expect(response.body.data.brand).toBe('AliasTest');
				});
			});
		});

		describe('PATCH /:collection/:id', () => {
			describe('can update item and extract json in same request', () => {
				test.each(vendors)('%s', async (vendor) => {
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

					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionProducts}/${created.id}`)
						.query({
							fields: 'id,json(metadata, color),json(metadata, brand)',
						})
						.send({
							metadata: {
								color: 'orange',
								brand: 'NewBrand',
							},
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.metadata_color_json).toBe('orange');
					expect(response.body.data.metadata_brand_json).toBe('NewBrand');
				});
			});
		});
	});
});
