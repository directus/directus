import {
	CreateCollection,
	CreateField,
	CreateFieldO2M,
	CreateItem,
	DeleteCollection,
	UpdateItem,
} from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { expect, it } from 'vitest';

export const collectionSingleton = 'test_items_singleton';
export const collectionSingletonO2M = 'test_items_singleton_o2m';

export type Singleton = {
	id?: number | string;
	name: string;
};

export type SingletonO2M = {
	id?: number | string;
	name: string;
	country_id?: number | string | null;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			console.log({ seed: 'singleton' });

			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollectionSingleton = `${collectionSingleton}_${pkType}`;
					const localCollectionSingletonO2M = `${collectionSingletonO2M}_${pkType}`;

					// Delete existing collections
					await DeleteCollection(vendor, { collection: localCollectionSingletonO2M });
					await DeleteCollection(vendor, { collection: localCollectionSingleton });

					// Create singleton collection
					await CreateCollection(vendor, {
						collection: localCollectionSingleton,
						primaryKeyType: pkType,
						meta: { singleton: true },
					});

					await CreateField(vendor, {
						collection: localCollectionSingleton,
						field: 'name',
						type: 'string',
					});

					// Create singleton O2M collection
					await CreateCollection(vendor, {
						collection: localCollectionSingletonO2M,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionSingletonO2M,
						field: 'name',
						type: 'string',
					});

					// Create O2M relationships
					await CreateFieldO2M(vendor, {
						collection: localCollectionSingleton,
						field: 'o2m',
						otherCollection: localCollectionSingletonO2M,
						otherField: 'singleton_id',
						primaryKeyType: pkType,
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

export const seedDBValues = async () => {
	let isSeeded = false;

	await Promise.all(
		vendors.map(async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				const localCollectionSingleton = `${collectionSingleton}_${pkType}`;
				const localCollectionSingletonO2M = `${collectionSingletonO2M}_${pkType}`;

				const item = await UpdateItem(vendor, {
					collection: localCollectionSingleton,
					item: {
						id:
							pkType === 'string'
								? SeedFunctions.generatePrimaryKeys(pkType, { quantity: 1, seed: localCollectionSingleton })[0]
								: undefined,
						name: 'parent',
					},
				});

				await CreateItem(vendor, {
					collection: localCollectionSingletonO2M,
					item: {
						id:
							pkType === 'string'
								? SeedFunctions.generatePrimaryKeys(pkType, { quantity: 1, seed: localCollectionSingletonO2M })[0]
								: undefined,
						name: 'child_o2m',
						singleton_id: item.id,
					},
				});
			}
		}),
	)
		.then(() => {
			isSeeded = true;
		})
		.catch(() => {
			isSeeded = false;
		});

	return isSeeded;
};
