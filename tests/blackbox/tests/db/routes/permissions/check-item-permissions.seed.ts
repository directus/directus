import { CreateCollection, CreateField, CreateItem, DeleteCollection, UpdateItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collection = 'test_collection_permissions';
export const collectionItemName = 'Bunny';
export const singleton = 'test_singleton_permissions';
export const singletonItemName = 'Carrot';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collection
				await DeleteCollection(vendor, { collection });

				// Create collection
				await CreateCollection(vendor, {
					collection,
					primaryKeyType: 'integer',
				});

				await CreateField(vendor, {
					collection,
					field: 'name',
					type: 'string',
				});

				// Delete existing singleton
				await DeleteCollection(vendor, { collection: singleton });

				// Create singleton collection
				await CreateCollection(vendor, {
					collection: singleton,
					primaryKeyType: 'integer',
					meta: { singleton: true },
				});

				await CreateField(vendor, {
					collection: singleton,
					field: 'name',
					type: 'string',
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300_000,
	);
};

export const seedDBValues = async () => {
	let isSeeded = false;

	await Promise.all(
		vendors.map(async (vendor) => {
			await CreateItem(vendor, {
				collection,
				item: {
					name: collectionItemName,
				},
			});

			await UpdateItem(vendor, {
				collection: singleton,
				item: {
					name: singletonItemName,
				},
			});
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
