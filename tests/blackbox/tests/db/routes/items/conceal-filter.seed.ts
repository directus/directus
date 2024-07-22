import { CreateCollection, CreateField, CreateFieldO2M, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';

export const collectionFirst = 'test_items_conceal_filter_first';
export const collectionSecond = 'test_items_conceal_filter_second';

export type First = {
	id?: number | string;
	string_field?: string;
};

export type Second = {
	id?: number | string;
	string_field?: string;
	first_id?: number | string | null;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollectionFirst = `${collectionFirst}_${pkType}`;
					const localCollectionSecond = `${collectionSecond}_${pkType}`;

					// Delete existing collections
					await DeleteCollection(vendor, { collection: localCollectionSecond });
					await DeleteCollection(vendor, { collection: localCollectionFirst });

					// Create first collection
					await CreateCollection(vendor, {
						collection: localCollectionFirst,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionFirst,
						field: 'string_field',
						type: 'string',
						meta: {
							special: ['conceal'],
						},
					});

					// Create seconds collection
					await CreateCollection(vendor, {
						collection: localCollectionSecond,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionSecond,
						field: 'string_field',
						type: 'string',
						meta: {
							special: ['conceal'],
						},
					});

					await CreateFieldO2M(vendor, {
						collection: localCollectionFirst,
						field: 'second_ids',
						primaryKeyType: pkType,
						otherCollection: localCollectionSecond,
						otherField: 'first_id',
					});

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300000,
	);
};

export const seedDBValues = async () => {
	let isSeeded = true;

	await Promise.all(
		vendors.map(async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				const localCollectionFirst = `${collectionFirst}_${pkType}`;

				// Create nested items with string value
				await CreateItem(vendor, {
					collection: localCollectionFirst,
					item: {
						id: pkType === 'string' ? randomUUID() : undefined,
						string_field: randomUUID(),
						second_ids: [
							{
								id: pkType === 'string' ? randomUUID() : undefined,
								string_field: randomUUID(),
							},
						],
					},
				});

				// Create nested items without string value
				await CreateItem(vendor, {
					collection: localCollectionFirst,
					item: {
						id: pkType === 'string' ? randomUUID() : undefined,
						second_ids: [
							{
								id: pkType === 'string' ? randomUUID() : undefined,
							},
						],
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
