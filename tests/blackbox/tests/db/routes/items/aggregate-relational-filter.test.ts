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

// Maps for looking up IDs by name — essential because CreateItem may return
// items in a different order than the input array (e.g., sorted by UUID value).
type VendorData = {
	articleMap: Record<string, string | number>; // title -> id
	categoryMap: Record<string, string | number>; // name -> id
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
		// Store created IDs per vendor to avoid cross-vendor ID conflicts
		const vendorData = new Map<string, VendorData>();

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
				//   - Article 1 (published): belongs to category A
				//   - Article 2 (published): belongs to categories A, B
				//   - Article 3 (draft):     belongs to categories A, B, C
				//   - Article 4 (draft):     belongs to category B
				//   - Article 5 (published): no categories

				const categories = await CreateItem(vendor, {
					collection: localCollectionCategories,
					item: [
						createCategory(pkType, 'Category A'),
						createCategory(pkType, 'Category B'),
						createCategory(pkType, 'Category C'),
					],
				});

				// Build name -> id map (do NOT rely on array index order)
				const categoryMap: Record<string, string | number> = {};

				for (const c of categories) {
					categoryMap[c.name] = c.id;
				}

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

				// Build title -> id map (do NOT rely on array index order)
				const articleMap: Record<string, string | number> = {};

				for (const a of articles) {
					articleMap[a.title] = a.id;
				}

				// Store maps per vendor
				vendorData.set(vendor, { articleMap, categoryMap });

				// Create junction entries using name-based lookups (order-independent)
				const catA = categoryMap['Category A']!;
				const catB = categoryMap['Category B']!;
				const catC = categoryMap['Category C']!;
				const art1 = articleMap['Article 1']!;
				const art2 = articleMap['Article 2']!;
				const art3 = articleMap['Article 3']!;
				const art4 = articleMap['Article 4']!;

				const junctionEntries = [
					// Article 1 (published) -> Category A
					{ [`${localCollectionArticles}_id`]: art1, [`${localCollectionCategories}_id`]: catA },
					// Article 2 (published) -> Category A, B
					{ [`${localCollectionArticles}_id`]: art2, [`${localCollectionCategories}_id`]: catA },
					{ [`${localCollectionArticles}_id`]: art2, [`${localCollectionCategories}_id`]: catB },
					// Article 3 (draft) -> Category A, B, C
					{ [`${localCollectionArticles}_id`]: art3, [`${localCollectionCategories}_id`]: catA },
					{ [`${localCollectionArticles}_id`]: art3, [`${localCollectionCategories}_id`]: catB },
					{ [`${localCollectionArticles}_id`]: art3, [`${localCollectionCategories}_id`]: catC },
					// Article 4 (draft) -> Category B
					{ [`${localCollectionArticles}_id`]: art4, [`${localCollectionCategories}_id`]: catB },
					// Article 5 (published) -> no categories
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
					const { categoryMap } = vendorData.get(vendor)!;

					// Filter: articles that belong to Category A
					// Expected: 3 articles (Article 1, 2, 3) - NOT 6 (which would be the inflated count from JOINs)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryMap['Category A'] },
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
					const { categoryMap } = vendorData.get(vendor)!;

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
										id: { _eq: categoryMap['Category B'] },
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
					const { categoryMap } = vendorData.get(vendor)!;

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
										id: { _eq: categoryMap['Category A'] },
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
					const { categoryMap } = vendorData.get(vendor)!;

					// Filter: articles that belong to Category A
					// countDistinct on status should return 2 (published, draft)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { countDistinct: 'status' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryMap['Category A'] },
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

			describe('count(*) with M2M filter and limit does not restrict aggregate', () => {
				it.each(vendors)('%s', async (vendor) => {
					const { categoryMap } = vendorData.get(vendor)!;

					// Filter: articles that belong to Category A, with limit=1
					// Expected: count should still be 3 (limit should not restrict the aggregate count)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryMap['Category A'] },
									},
								},
							}),
							limit: 1,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					// Limit must not restrict the aggregate — full count should be returned
					expect(Number(response.body.data[0].count)).toBe(3);
				});
			});

			describe('count(*) with groupBy, M2M filter, and limit does not restrict aggregate', () => {
				it.each(vendors)('%s', async (vendor) => {
					const { categoryMap } = vendorData.get(vendor)!;

					// Edge case: aggregate[count]=*&groupBy=status&filter[relational]&limit=3
					// The limit should NOT restrict the inner DISTINCT PK set
					// Expected: same 2 groups as without limit - 'published' (2) and 'draft' (1)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							groupBy: ['status'],
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										id: { _eq: categoryMap['Category A'] },
									},
								},
							}),
							limit: 3,
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

			describe('count(*) with M2M filter using _contains on category name', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Filter: articles that belong to a category whose name contains 'C'
					// Categories with 'C': 'Category A', 'Category B', 'Category C' (all contain 'C')
					// So all articles with categories should match = articles 1, 2, 3, 4 (not 5)
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArticles}`)
						.query({
							aggregate: { count: '*' },
							filter: JSON.stringify({
								categories: {
									[`${localCollectionCategories}_id`]: {
										name: { _contains: 'Category' },
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toHaveLength(1);
					// 4 articles have at least one category (Article 5 has none)
					expect(Number(response.body.data[0].count)).toBe(4);
				});
			});
		});
	});
});
