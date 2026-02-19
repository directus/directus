import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionArticles, collectionShapes, getTestsSchema, seedDBValues } from './relational-json.seed';

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
	const localCollectionShapes = `${collectionShapes}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('M2O Relational JSON', () => {
			describe('retrieves json field from M2O relation with simple path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, color)',
							sort: 'title',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.length).toBeGreaterThan(0);

					// First article should have category with color 'blue' (Tech category)
					expect(response.body.data[0]).toHaveProperty('category_id');
					expect(response.body.data[0].category_id.metadata_color_json).toBe('blue');

					// Third article should have category with color 'green' (Sports category)
					expect(response.body.data[2]).toHaveProperty('category_id');
					expect(response.body.data[2].category_id.metadata_color_json).toBe('green');
				});
			});

			describe('retrieves json field from M2O relation with nested path', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,json(category_id.metadata, settings.priority)',
							sort: 'title',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					// First article's category has priority 1
					expect(response.body.data[0]).toHaveProperty('category_id');
					const priority = response.body.data[0].category_id.metadata_settings_priority_json;
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
							sort: 'title',
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data[0]).toHaveProperty('category_id');
					expect(response.body.data[0].category_id).toHaveProperty('metadata_color_json');
					expect(response.body.data[0].category_id).toHaveProperty('metadata_icon_json');
					expect(response.body.data[0].category_id.metadata_color_json).toBe('blue');
					expect(response.body.data[0].category_id.metadata_icon_json).toBe('laptop');
				});
			});

			describe('combines M2O relational json with regular fields', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,title,category_id.name,json(category_id.metadata, color)',
							sort: 'title',
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
					expect(item.category_id).toHaveProperty('metadata_color_json');

					expect(item.category_id.name).toBe('Tech');
					expect(item.category_id.metadata_color_json).toBe('blue');
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
					expect(response.body.data).toHaveProperty('comments');

					// O2M should return an array of nested items
					const comments = response.body.data.comments;
					expect(Array.isArray(comments)).toBe(true);
					expect(comments.length).toBe(3);

					// First article's comments have types: 'review', 'feedback', 'question'
					const types = comments.map((c: any) => c.data_type_json);
					expect(types).toContain('review');
					expect(types).toContain('feedback');
					expect(types).toContain('question');
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
					expect(response.body.data).toHaveProperty('comments');

					const comments = response.body.data.comments;
					expect(Array.isArray(comments)).toBe(true);

					// First article's comments have ratings: 5, 4, 3
					const numericRatings = comments.map((c: any) => Number(c.data_rating_json));
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
					expect(response.body.data).toHaveProperty('comments');

					const comments = response.body.data.comments;

					// Should return empty array for no related items
					expect(Array.isArray(comments)).toBe(true);
					expect(comments).toEqual([]);
				});
			});
		});

		describe('Error handling', () => {
			describe('silently ignores non-existent relation in json()', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							fields: 'id,json(nonexistent.metadata, color)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert - Directus silently ignores unknown relational fields
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.length).toBeGreaterThan(0);
					expect(response.body.data[0]).toHaveProperty('id');
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

					// Assert - using json() on a non-JSON field returns an error
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
					expect(response.body.data[0].category_id.metadata_color_json).toBe('blue');
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

					if (pkType === 'integer') {
						expect(Number(firstId) > Number(secondId)).toBe(true);
					} else {
						expect(firstId > secondId).toBe(true);
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

					// For integer PKs, the second article should be first in results (offset 1)
					if (pkType === 'integer') {
						expect(response.body.data[0].title).toBe('Championship Finals');
					}
				});
			});
		});

		describe('A2O (M2A) Relational JSON', () => {
			describe('retrieves json field from A2O relation scoped to circles (returns array)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Shape A has 2 circle children with metadata colors: 'red', 'blue'
					const shapes = vendorSchemaValues[vendor]![localCollectionShapes]!.id;
					const firstShapeId = shapes[0];

					const localCollectionCircles = `${localCollectionShapes.replace('shapes', 'circles')}`;

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${firstShapeId}`)
						.query({
							fields: `id,name,json(children.item:${localCollectionCircles}.metadata, color)`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					expect(response.body.data).toHaveProperty('children');

					const children = response.body.data.children;
					expect(Array.isArray(children)).toBe(true);

					// Filter to only children where json extraction succeeded (circles have metadata_color_json)
					const resolvedChildren = children.filter((c: any) => c.item?.metadata_color_json != null);
					expect(resolvedChildren.length).toBe(2);

					const colors = resolvedChildren.map((c: any) => c.item.metadata_color_json);
					expect(colors).toContain('red');
					expect(colors).toContain('blue');
				});
			});

			describe('retrieves json field from A2O relation scoped to squares', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Shape B has 2 square children with metadata colors: 'orange', 'pink'
					const shapes = vendorSchemaValues[vendor]![localCollectionShapes]!.id;
					const secondShapeId = shapes[1];

					const localCollectionSquares = `${localCollectionShapes.replace('shapes', 'squares')}`;

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${secondShapeId}`)
						.query({
							fields: `id,name,json(children.item:${localCollectionSquares}.metadata, color)`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					expect(response.body.data).toHaveProperty('children');

					const children = response.body.data.children;
					expect(Array.isArray(children)).toBe(true);

					// Filter to only children where json extraction succeeded (squares have metadata_color_json)
					const resolvedChildren = children.filter((c: any) => c.item?.metadata_color_json != null);
					expect(resolvedChildren.length).toBe(2);

					const colors = resolvedChildren.map((c: any) => c.item.metadata_color_json);
					expect(colors).toContain('orange');
					expect(colors).toContain('pink');
				});
			});

			describe('A2O relational json returns empty/null for shape with no matching children', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Shape C has no children
					const shapes = vendorSchemaValues[vendor]![localCollectionShapes]!.id;
					const thirdShapeId = shapes[2];

					const localCollectionCircles = `${localCollectionShapes.replace('shapes', 'circles')}`;

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${thirdShapeId}`)
						.query({
							fields: `id,name,json(children.item:${localCollectionCircles}.metadata, color)`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();

					expect(response.body.data).toHaveProperty('children');

					const children = response.body.data.children;

					// Should return empty array for no matching children
					expect(Array.isArray(children)).toBe(true);
					expect(children).toEqual([]);
				});
			});

			describe('silently ignores invalid collection scope in A2O', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}`)
						.query({
							fields: 'id,json(children.item:nonexistent_collection.metadata, color)',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert - Directus silently ignores invalid A2O collection scopes
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toBeDefined();
					expect(response.body.data.length).toBeGreaterThan(0);
					expect(response.body.data[0]).toHaveProperty('id');
				});
			});
		});
	});
});
