import vendors from '@common/get-dbs-to-test';
import { CreateCollection, CreateField, CreateItem, DeleteCollection } from '@common/index';
import { v4 as uuid } from 'uuid';

export const collectionFirst = 'test_app_cache_first';
export const collectionIgnored = 'test_app_cache_ignored';

export type First = {
	id?: number;
	string_field?: string;
};

export type Second = {
	id?: number;
	string_field?: string;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionIgnored });
				await DeleteCollection(vendor, { collection: collectionFirst });

				// Create first collection
				await CreateCollection(vendor, {
					collection: collectionFirst,
				});

				await CreateField(vendor, {
					collection: collectionFirst,
					field: 'string_field',
					type: 'string',
				});

				// Create seconds collection
				await CreateCollection(vendor, {
					collection: collectionIgnored,
				});

				await CreateField(vendor, {
					collection: collectionIgnored,
					field: 'string_field',
					type: 'string',
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000
	);
};

export const seedDBValues = async () => {
	let isSeeded = true;

	await Promise.all(
		vendors.map(async (vendor) => {
			await CreateItem(vendor, {
				collection: collectionFirst,
				item: {
					string_field: uuid(),
				},
			});

			await CreateItem(vendor, {
				collection: collectionIgnored,
				item: {
					string_field: uuid(),
				},
			});
		})
	)
		.then(() => {
			isSeeded = true;
		})
		.catch(() => {
			isSeeded = false;
		});

	return isSeeded;
};
