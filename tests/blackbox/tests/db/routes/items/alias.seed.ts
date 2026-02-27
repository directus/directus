import { CreateCollection, CreateField, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '../../query/filter';

export const collectionProducts = 'test_items_alias_products';

export type Product = {
	id?: number | string;
	name: string;
	metadata?: {
		color?: string;
		brand?: string;
		dimensions?: {
			width?: number;
			height?: number;
		};
		tags?: string[];
		variants?: Array<{
			sku?: string;
			price?: number;
		}>;
	};
	settings?: {
		theme?: string;
	};
};

export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionProducts}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 4,
					seed: `collectionAliasProducts${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['Alpha', 'Beta', 'Gamma', 'Zeta'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [
					{
						color: 'red',
						brand: 'BrandX',
						dimensions: { width: 10, height: 20 },
						tags: ['electronics', 'premium'],
						variants: [{ sku: 'SKU-001', price: 99.99 }],
					},
					{
						color: 'blue',
						brand: 'BrandY',
						dimensions: { width: 15, height: 25 },
						tags: ['home'],
						variants: [{ sku: 'SKU-002', price: 49.99 }],
					},
					{
						color: 'green',
						brand: 'BrandX',
						dimensions: { width: 12, height: 18 },
						tags: ['outdoor'],
						variants: [],
					},
					{
						// Item with some null/missing values
						color: 'black',
						tags: [],
					},
				],
			},
			settings: {
				field: 'settings',
				type: 'json',
				filters: false,
				possibleValues: [
					{ theme: 'dark' },
					{ theme: 'light' },
					{ theme: 'auto' },
					null,
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
					const localCollectionProducts = `${collectionProducts}_${pkType}`;

					await DeleteCollection(vendor, { collection: localCollectionProducts });

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
						meta: { special: ['cast-json'] },
					});

					await CreateField(vendor, {
						collection: localCollectionProducts,
						field: 'settings',
						type: 'json',
						meta: { special: ['cast-json'] },
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
				const localCollectionProducts = `${collectionProducts}_${pkType}`;

				const itemProducts = [];

				for (let i = 0; i < schema[localCollectionProducts].id.possibleValues.length; i++) {
					const product: Product = {
						name: schema[localCollectionProducts].name.possibleValues[i],
						metadata: schema[localCollectionProducts].metadata.possibleValues[i],
						settings: schema[localCollectionProducts].settings.possibleValues[i],
					};

					if (pkType === 'string') {
						product.id = schema[localCollectionProducts].id.possibleValues[i];
					}

					itemProducts.push(product);
				}

				const products = await CreateItem(vendor, {
					collection: localCollectionProducts,
					item: itemProducts,
				});

				set(vendorSchemaValues, `${vendor}.${localCollectionProducts}.id`, products.map((p: Product) => p.id));
			}
		}),
	);
};
