import { CreateCollection, CreateField, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionName = 'test_query_field_selection';

export type Item = {
	id?: number;
	field_a?: string;
	field_b?: string;
	field_c?: string;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collection
				await DeleteCollection(vendor, { collection: collectionName });

				// Create collection
				await CreateCollection(vendor, {
					collection: collectionName,
					primaryKeyType: 'integer',
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionName,
					field: 'field_a',
					type: 'string',
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionName,
					field: 'field_b',
					type: 'string',
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionName,
					field: 'field_c',
					type: 'string',
					meta: {},
					schema: {},
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
	let isSeeded = true;

	await Promise.all(
		vendors.map(async (vendor) => {
			await CreateItem(vendor, {
				collection: collectionName,
				item: [
					{ field_a: 'value_a1', field_b: 'value_b1', field_c: 'value_c1' },
					{ field_a: 'value_a2', field_b: 'value_b2', field_c: 'value_c2' },
				],
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
