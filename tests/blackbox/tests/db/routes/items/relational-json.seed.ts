import { CreateCollection, CreateField, CreateFieldO2M, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '../../query/filter';

export const collectionArticles = 'test_rel_json_articles';
export const collectionCategories = 'test_rel_json_categories';
export const collectionComments = 'test_rel_json_comments';

export type Category = {
	id?: number | string;
	name: string;
	metadata?: {
		color?: string;
		icon?: string;
		settings?: {
			featured?: boolean;
			priority?: number;
		};
	};
};

export type Article = {
	id?: number | string;
	title: string;
	category_id?: number | string | Category;
};

export type Comment = {
	id?: number | string;
	article_id?: number | string;
	content: string;
	data?: {
		type?: string;
		rating?: number;
		tags?: string[];
	};
};

// Helper to avoid nested ternary: first two articles to first category, third to second, fourth to third
function getCategoryIndex(i: number): number {
	if (i < 2) return 0;
	if (i === 2) return 1;
	return 2;
}

// Helper to avoid nested ternary: first 3 to first article, next 2 to second, last 1 to third
function getArticleIndex(i: number): number {
	if (i < 3) return 0;
	if (i < 5) return 1;
	return 2;
}

export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionCategories}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 3,
					seed: `collectionCategories${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['Tech', 'Sports', 'Music'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [
					{ color: 'blue', icon: 'laptop', settings: { featured: true, priority: 1 } },
					{ color: 'green', icon: 'football', settings: { featured: false, priority: 2 } },
					{ color: 'purple', icon: 'music', settings: { featured: true, priority: 3 } },
				],
			},
		},
		[`${collectionArticles}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 4,
					seed: `collectionArticles${seed}`,
					incremental: true,
				}),
			},
			title: {
				field: 'title',
				type: 'string',
				filters: true,
				possibleValues: ['AI Revolution', 'Championship Finals', 'New Album Release', 'Tech Tips'],
			},
		},
		[`${collectionComments}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 6,
					seed: `collectionComments${seed}`,
					incremental: true,
				}),
			},
			content: {
				field: 'content',
				type: 'string',
				filters: true,
				possibleValues: ['Great article!', 'Very informative', 'Thanks for sharing', 'Loved it', 'Nice work', 'Helpful'],
			},
			data: {
				field: 'data',
				type: 'json',
				filters: false,
				possibleValues: [
					{ type: 'review', rating: 5, tags: ['helpful', 'detailed'] },
					{ type: 'feedback', rating: 4, tags: ['constructive'] },
					{ type: 'question', rating: 3, tags: ['curious'] },
					{ type: 'review', rating: 5, tags: ['excellent'] },
					{ type: 'feedback', rating: 4, tags: ['suggestion'] },
					{ type: 'review', rating: 5, tags: ['amazing', 'must-read'] },
				],
			},
		},
	};

	return schema;
}

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollectionCategories = `${collectionCategories}_${pkType}`;
					const localCollectionArticles = `${collectionArticles}_${pkType}`;
					const localCollectionComments = `${collectionComments}_${pkType}`;

					// Delete existing collections (in reverse order due to FKs)
					await DeleteCollection(vendor, { collection: localCollectionComments });
					await DeleteCollection(vendor, { collection: localCollectionArticles });
					await DeleteCollection(vendor, { collection: localCollectionCategories });

					// Create categories collection (has JSON metadata)
					await CreateCollection(vendor, {
						collection: localCollectionCategories,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionCategories,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionCategories,
						field: 'metadata',
						type: 'json',
					});

					// Create articles collection (M2O to categories)
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
						field: 'category_id',
						type: pkType === 'string' ? 'string' : 'integer',
						schema: {
							foreign_key_table: localCollectionCategories,
							foreign_key_column: 'id',
						},
						meta: {
							special: ['m2o'],
						},
					});

					// Create comments collection (O2M from articles, has JSON data)
					await CreateCollection(vendor, {
						collection: localCollectionComments,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionComments,
						field: 'content',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionComments,
						field: 'data',
						type: 'json',
					});

					// Create O2M relation from articles to comments
					await CreateFieldO2M(vendor, {
						collection: localCollectionArticles,
						field: 'comments',
						primaryKeyType: pkType,
						otherCollection: localCollectionComments,
						otherField: 'article_id',
					});

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		600_000,
	);
};

export const seedDBValues = async (cachedSchema: CachedTestsSchema, vendorSchemaValues: TestsSchemaVendorValues) => {
	await Promise.all(
		vendors.map(async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				const schema = cachedSchema[pkType];

				const localCollectionCategories = `${collectionCategories}_${pkType}`;
				const localCollectionArticles = `${collectionArticles}_${pkType}`;
				const localCollectionComments = `${collectionComments}_${pkType}`;

				// Create categories
				const itemCategories = [];

				for (let i = 0; i < schema[localCollectionCategories].id.possibleValues.length; i++) {
					const category: Category = {
						name: schema[localCollectionCategories].name.possibleValues[i],
						metadata: schema[localCollectionCategories].metadata.possibleValues[i],
					};

					if (pkType === 'string') {
						category.id = schema[localCollectionCategories].id.possibleValues[i];
					}

					itemCategories.push(category);
				}

				const categories = await CreateItem(vendor, {
					collection: localCollectionCategories,
					item: itemCategories,
				});

				const categoriesIDs = categories.map((c: Category) => c.id);

				// Create articles (linked to categories)
				const itemArticles = [];

				for (let i = 0; i < schema[localCollectionArticles].id.possibleValues.length; i++) {
					const article: Article = {
						title: schema[localCollectionArticles].title.possibleValues[i],
						// Link to categories: first two articles to first category, third to second, fourth to third
						category_id: categoriesIDs[getCategoryIndex(i)],
					};

					if (pkType === 'string') {
						article.id = schema[localCollectionArticles].id.possibleValues[i];
					}

					itemArticles.push(article);
				}

				const articles = await CreateItem(vendor, {
					collection: localCollectionArticles,
					item: itemArticles,
				});

				const articlesIDs = articles.map((a: Article) => a.id);

				// Create comments (linked to articles)
				const itemComments = [];

				for (let i = 0; i < schema[localCollectionComments].id.possibleValues.length; i++) {
					const comment: Comment = {
						content: schema[localCollectionComments].content.possibleValues[i],
						data: schema[localCollectionComments].data.possibleValues[i],
						// Link comments to articles: first 3 to first article, next 2 to second, last 1 to third
						article_id: articlesIDs[getArticleIndex(i)],
					};

					if (pkType === 'string') {
						comment.id = schema[localCollectionComments].id.possibleValues[i];
					}

					itemComments.push(comment);
				}

				const comments = await CreateItem(vendor, {
					collection: localCollectionComments,
					item: itemComments,
				});

				const commentsIDs = comments.map((c: Comment) => c.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionCategories}.id`, categoriesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionArticles}.id`, articlesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionComments}.id`, commentsIDs);
			}
		}),
	);
};
