/**
 * E2E tests for aggregation with relational filters (M2M/M2O).
 *
 * Tests that aggregate counts return correct values when relational filters
 * create JOINs, which could previously inflate counts due to duplicate rows.
 *
 * @see https://github.com/directus/directus/issues/23395
 */
import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreateCollection, CreateField, CreateFieldM2M, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

// Collection names for M2M tests
const collectionArticles = 'test_aggregate_articles';
const collectionCategories = 'test_aggregate_categories';
const junctionCollection = 'test_aggregate_articles_categories';

type Article = {
	id?: number | string;
	title: string;
	status: string;
};

type Category = {
	id?: number | string;
	name: string;
};

function createArticle(pkType: PrimaryKeyType, title: string, status: string): Article {
	const article: Article = { title, status };

	if (pkType === 'string') {
		article.id = 'article-' + randomUUID();
	}

	return article;
}

function createCategory(pkType: PrimaryKeyType, name: string): Category {
	const category: Category = { name };

	if (pkType === 'string') {
		category.id = 'category-' + randomUUID();
	}

	return category;
}

describe.each(PRIMARY_KEY_TYPES)('/items aggregation with relational filters', (pkType) => {
	const localCollectionArticles = `${collectionArticles}_${pkType}`;
	const localCollectionCategories = `${collectionCategories}_${pkType}`;
	const localJunctionCollection = `${junctionCollection}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		// Store created IDs for cleanup and assertions
		let categoryIds: (string | number)[] = [];
		let articleIds: (string | number)[] = [];

		beforeAll(async () => {
			// Setup schema and test data for each vendor
			for (const vendor of vendors) {
				// Delete existing collections (if any)
				await DeleteCollection(vendor, { collection: localJunctionCollection });
				await DeleteCollection(vendor, { collection: localCollectionArticles });
				await DeleteCollection(vendor, { collection: localCollectionCategories });

				// Create categories collection
				await CreateCollection(vendor, {
					collection: localCollectionCategories,
					primaryKeyType: pkType,
				});

				await CreateField(vendor, {
					collection: localCollectionCategories,
					field: 'name',
					type: 'string',
				});

				// Create articles collection
				await CreateCollection(vendor, {
					collection: localCollectionArticles,
					primaryKeyType: pkType,
				});

				await CreateField(vendor, {
					collection: localCollectionArticles,
					field: 'title',
					type: 'string',
				});

				await CreateField(vendor, {
					collection: localCollectionArticles,
					field: 'status',
					type: 'string',
				});

				// Create M2M relationship
				await CreateFieldM2M(vendor, {
					collection: localCollectionArticles,
					field: 'categories',
					otherCollection: localCollectionCategories,
					otherField: 'articles',
					junctionCollection: localJunctionCollection,
					primaryKeyType: pkType,
				});

				// Create test data:
				// - 3 categories: A, B, C
				// - 5 articles:
				//   - Article 1: belongs to category A (1 junction row)
				//   - Article 2: belongs to categories A, B (2 junction rows)
				//   - Article 3: belongs to categories A, B, C (3 junction rows)
				//   - Article 4: belongs to category B (1 junction row)
				//   - Article 5: no categories (0 junction rows)

				const categories = await CreateItem(vendor, {
					collection: localCollectionCategories,
					item: [
						createCategory(pkType, 'Category A'),
						createCategory(pkType, 'Category B'),
						createCategory(pkType, 'Category C'),
					],
				});

				categoryIds = categories.map((c: Category) => c.id!);

				const articles = await CreateItem(vendor, {
					collection: localCollectionArticles,
					item: [
						createArticle(pkType, 'Article 1', 'published'),
						createArticle(pkType, 'Article 2', 'published'),
						createArticle(pkType, 'Article 3', 'draft'),
						createArticle(pkType, 'Article 4', 'draft'),
						createArticle(pkType, 'Article 5', 'published'),
					],
				});

				articleIds = articles.map((a: Article) => a.id!);

				// Create junction entries
				const junctionEntries = [
					// Article 1 -> Category A
					{ [`${localCollectionArticles}_id`]: articleIds[0], [`${localCollectionCategories}_id`]: categoryIds[0] },
					// Article 2 -> Category A, B
					{ [`${localCollectionArticles}_id`]: articleIds[1], [`${localCollectionCategories}_id`]: categoryIds[0] },
					{ [`${localCollectionArticles}_id`]: articleIds[1], [`${localCollectionCategories}_id`]: categoryIds[1] },
					// Article 3 -> Category A, B, C
					{ [`${localCollectionArticles}_id`]: articleIds[2], [`${localCollectionCategories}_id`]: categoryIds[0] },
					{ [`${localCollectionArticles}_id`]: articleIds[2], [`${localCollectionCategories}_id`]: categoryIds[1] },
					{ [`${localCollectionArticles}_id`]: articleIds[2], [`${localCollectionCategories}_id`]: categoryIds[2] },
					// Article 4 -> Category B
					{ [`${localCollectionArticles}_id`]: articleIds[3], [`${localCollectionCategories}_id`]: categoryIds[1] },
					// Article 5 -> no categories (not in junction)
				];

				await CreateItem(vendor, {
					collection: localJunctionCollection,
					item: junctionEntries,
				});
			}
		}, 300000);

		describe('Aggregation Tests with M2M Relational Filters', () => {
			describe('count(*) with M2M filter returns correct unique count', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles that belong to Category A
					// Expected: 3 articles (Article 1, 2, 3) - NOT 6 (which would be the inflated count from JOINs)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryIds[0] },
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					// The count should be 3 (unique articles), not inflated by JOINs
					expect(Number(response.body.data[0].count)).toBe(3);
				});
			});

			describe('count(field) with M2M filter returns correct unique count', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles that belong to Category B
					// Expected: 3 articles (Article 2, 3, 4)
					// count(status) should count non-null status values for those 3 articles
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: 'status' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryIds[1] },
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					// Should count 3 unique articles' status fields
					expect(Number(response.body.data[0].count.status)).toBe(3);
				});
			});

			describe('count(*) without relational filter (no regression)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles with status = 'published' (no relational filter)
					// Expected: 3 articles (Article 1, 2, 5)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							filter: { status: { _eq: 'published' } },
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					expect(Number(response.body.data[0].count)).toBe(3);
				});
			});

			describe('count(*) with groupBy and M2M filter', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles that belong to Category A, grouped by status
					// Expected: 2 groups - 'published' (2 articles: 1, 2) and 'draft' (1 article: 3)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							groupBy: ['status'],
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryIds[0] },
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(2);

					const publishedGroup = response.body.data.find((g: any) => g.status === 'published');
					const draftGroup = response.body.data.find((g: any) => g.status === 'draft');

					expect(publishedGroup).toBeDefined();
					expect(Number(publishedGroup.count)).toBe(2);
					expect(draftGroup).toBeDefined();
					expect(Number(draftGroup.count)).toBe(1);
				});
			});

			describe('countDistinct with M2M filter', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles that belong to Category A
					// countDistinct on status should return 2 (published, draft)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { countDistinct: 'status' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryIds[0] },
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					expect(Number(response.body.data[0].countDistinct.status)).toBe(2);
				});
			});

			describe('count(*) with deeply nested M2M filter (multiple JOINs)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles that belong to a category with name = 'Category A'
					// This creates JOINs through the junction table
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										name: { _eq: 'Category A' },
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					expect(Number(response.body.data[0].count)).toBe(3);
				});
			});
		});
	});
});
