import { CreateCollection, CreateField, CreateFieldM2O, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '../../query/filter';

export const collectionCategories = 'test_json_filter_categories';
export const collectionProducts = 'test_json_filter_products';

export type Category = {
	id?: number | string;
	name: string;
	metadata?: {
		color?: string;
	};
};

export type Product = {
	id?: number | string;
	name: string;
	metadata?: {
		color?: string;
		brand?: string;
		level?: number;
		tags?: string[];
		settings?: {
			theme?: string;
		};
	};
	category_id?: number | string | null;
};

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
					seed: `collectionJsonFilterCategories${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['Tech', 'Sports', 'Home'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [{ color: 'blue' }, { color: 'green' }, { color: 'red' }],
			},
		},
		[`${collectionProducts}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 5,
					seed: `collectionJsonFilterProducts${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [
					{
						color: 'red',
						brand: 'BrandX',
						level: 2,
						tags: ['electronics', 'sale'],
						settings: { theme: 'dark' },
					},
					{
						color: 'blue',
						brand: 'BrandY',
						level: 5,
						tags: ['home', 'new'],
						settings: { theme: 'light' },
					},
					{
						color: 'green',
						brand: 'BrandX',
						level: 8,
						tags: ['outdoor'],
						settings: { theme: 'dark' },
					},
					{
						color: 'yellow',
						brand: 'BrandZ',
						level: 3,
						tags: ['clearance'],
						settings: { theme: 'auto' },
					},
					{
						color: 'black',
						tags: [],
					},
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
					const localCollectionProducts = `${collectionProducts}_${pkType}`;

					// Delete existing collections (products first due to FK constraint)
					await DeleteCollection(vendor, { collection: localCollectionProducts });
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

					await CreateField(vendor, {
						collection: localCollectionCategories,
						field: 'metadata',
						type: 'json',
					});

					// Create products collection
					await CreateCollection(vendor, {
						collection: localCollectionProducts,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionProducts,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionProducts,
						field: 'metadata',
						type: 'json',
					});

					await CreateFieldM2O(vendor, {
						collection: localCollectionProducts,
						field: 'category_id',
						primaryKeyType: pkType,
						otherCollection: localCollectionCategories,
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
				const localCollectionProducts = `${collectionProducts}_${pkType}`;

				// Create categories first
				const itemCategories = [];

				for (let i = 0; i < schema[localCollectionCategories]!['id']!.possibleValues.length; i++) {
					const category: Category = {
						name: schema[localCollectionCategories]!['name']!.possibleValues[i],
						metadata: schema[localCollectionCategories]!['metadata']!.possibleValues[i],
					};

					if (pkType === 'string') {
						category.id = schema[localCollectionCategories]!['id']!.possibleValues[i];
					}

					itemCategories.push(category);
				}

				const categories = await CreateItem(vendor, {
					collection: localCollectionCategories,
					item: itemCategories,
				});

				// Build name→id map for DB-ordering safety
				const categoryIdByName = Object.fromEntries(categories.map((c: Category) => [c.name as string, c.id]));

				const categoriesIDs = (schema[localCollectionCategories]!['name']!.possibleValues as string[]).map(
					(name) => categoryIdByName[name]!,
				);

				// category name order: ['Tech', 'Sports', 'Home'] → indices 0, 1, 2
				// Alpha → Tech (0), Beta → Sports (1), Gamma → Tech (0), Delta → Home (2), Epsilon → null
				const productCategoryIndices = [0, 1, 0, 2, null];

				// Create products with correct category_id values
				const itemProducts = [];

				for (let i = 0; i < schema[localCollectionProducts]!['id']!.possibleValues.length; i++) {
					const categoryIndex = productCategoryIndices[i];

					const product: Product = {
						name: schema[localCollectionProducts]!['name']!.possibleValues[i],
						metadata: schema[localCollectionProducts]!['metadata']!.possibleValues[i],
						category_id: categoryIndex !== null ? categoriesIDs[categoryIndex] : null,
					};

					if (pkType === 'string') {
						product.id = schema[localCollectionProducts]!['id']!.possibleValues[i];
					}

					itemProducts.push(product);
				}

				const products = await CreateItem(vendor, {
					collection: localCollectionProducts,
					item: itemProducts,
				});

				const productsIDs = products.map((p: Product) => p.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionCategories}.id`, categoriesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionProducts}.id`, productsIDs);
			}
		}),
	);
};
