import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionArticles, getTestsSchema, seedDBValues } from './relational-json.seed';

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
	const localCollectionArticles = `${collectionArticles}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('M2O Relational JSON', () => {
			describe('retrieves json field from M2O relation with simple path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, color)',
							sort: 'id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.length).toBeGreaterThan(0);

					// First article should have category color 'blue' (Tech category)
					expect(response.body.data[0]).toHaveProperty('category_id_metadata_color_json');
					expect(response.body.data[0].category_id_metadata_color_json).toBe('blue');

					// Third article should have category color 'green' (Sports category)
					expect(response.body.data[2]).toHaveProperty('category_id_metadata_color_json');
					expect(response.body.data[2].category_id_metadata_color_json).toBe('green');
				});
			});

			describe('retrieves json field from M2O relation with nested path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, settings.priority)',
							sort: 'id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					// First article's category has priority 1
					expect(response.body.data[0]).toHaveProperty('category_id_metadata_settings_priority_json');
					const priority = response.body.data[0].category_id_metadata_settings_priority_json;
					expect(Number(priority)).toBe(1);
				});
			});

			describe('retrieves multiple json extractions from M2O relation', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, color),json(category_id.metadata, icon)',
							sort: 'id',
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data[0]).toHaveProperty('category_id_metadata_color_json');
					expect(response.body.data[0]).toHaveProperty('category_id_metadata_icon_json');
					expect(response.body.data[0].category_id_metadata_color_json).toBe('blue');
					expect(response.body.data[0].category_id_metadata_icon_json).toBe('laptop');
				});
			});

			describe('combines M2O relational json with regular fields', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,category_id.name,json(category_id.metadata, color)',
							sort: 'id',
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					const item = response.body.data[0];

					expect(item).toHaveProperty('id');
					expect(item).toHaveProperty('title');
					expect(item).toHaveProperty('category_id');
					expect(item.category_id).toHaveProperty('name');
					expect(item).toHaveProperty('category_id_metadata_color_json');

					expect(item.category_id.name).toBe('Tech');
					expect(item.category_id_metadata_color_json).toBe('blue');
				});
			});
		});

		describe('O2M Relational JSON', () => {
			describe('retrieves json field from O2M relation (returns array)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - First article has 3 comments
					const articles = vendorSchemaValues[vendor][localCollectionArticles].id;
					const firstArticleId = articles[0];

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}/${firstArticleId}`)
						.query({
							fields: 'id,title,json(comments.data, type)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveProperty('comments_data_type_json');

					// O2M should return an array of values
					const types = response.body.data.comments_data_type_json;

					// Parse if string (some databases return JSON string)
					const typesArray = typeof types === 'string' ? JSON.parse(types) : types;
					expect(Array.isArray(typesArray)).toBe(true);
					expect(typesArray.length).toBe(3);

					// First article's comments have types: 'review', 'feedback', 'question'
					expect(typesArray).toContain('review');
					expect(typesArray).toContain('feedback');
					expect(typesArray).toContain('question');
				});
			});

			describe('retrieves json field from O2M relation with nested path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const articles = vendorSchemaValues[vendor][localCollectionArticles].id;
					const firstArticleId = articles[0];

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}/${firstArticleId}`)
						.query({
							fields: 'id,title,json(comments.data, rating)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveProperty('comments_data_rating_json');

					const ratings = response.body.data.comments_data_rating_json;
					const ratingsArray = typeof ratings === 'string' ? JSON.parse(ratings) : ratings;
					expect(Array.isArray(ratingsArray)).toBe(true);

					// First article's comments have ratings: 5, 4, 3
					const numericRatings = ratingsArray.map((r: any) => Number(r));
					expect(numericRatings).toContain(5);
					expect(numericRatings).toContain(4);
					expect(numericRatings).toContain(3);
				});
			});

			describe('O2M relational json returns empty array for no related items', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - Fourth article has no comments
					const articles = vendorSchemaValues[vendor][localCollectionArticles].id;
					const fourthArticleId = articles[3];

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}/${fourthArticleId}`)
						.query({
							fields: 'id,title,json(comments.data, type)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveProperty('comments_data_type_json');

					const types = response.body.data.comments_data_type_json;

					// Should return empty array or null for no related items
					if (types !== null) {
						const typesArray = typeof types === 'string' ? JSON.parse(types) : types;
						expect(typesArray).toEqual([]);
					}
				});
			});
		});

		describe('Error handling', () => {
			describe('returns error for non-existent relation', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,json(nonexistent.metadata, color)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});

			describe('returns error for non-JSON field at end of relational path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action - 'name' is a string field, not JSON
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,json(category_id.name, invalid)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toBeDefined();
				});
			});
		});

		describe('Works with filters', () => {
			describe('M2O relational json with filter', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, color)',
							filter: JSON.stringify({ title: { _eq: 'AI Revolution' } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveLength(1);
					expect(response.body.data[0].title).toBe('AI Revolution');
					expect(response.body.data[0].category_id_metadata_color_json).toBe('blue');
				});
			});
		});

		describe('Works with sorting', () => {
			describe('M2O relational json with sorting', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, color)',
							sort: '-id',
							limit: 2,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveLength(2);

					// Results should be in descending order by id
					const firstId = response.body.data[0].id;
					const secondId = response.body.data[1].id;

					if (pkType === 'string') {
						expect(firstId > secondId).toBe(true);
					} else {
						expect(Number(firstId) > Number(secondId)).toBe(true);
					}
				});
			});
		});

		describe('Works with pagination', () => {
			describe('M2O relational json with pagination', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, color)',
							sort: 'id',
							limit: 2,
							offset: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data).toHaveLength(2);

					// Second article should be first in results (offset 1)
					expect(response.body.data[0].title).toBe('Championship Finals');
				});
			});
		});
	});
});
