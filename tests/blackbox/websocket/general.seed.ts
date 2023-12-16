import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { expect, it } from 'vitest';

export const collectionFirst = 'test_ws_general_first';

export type First = {
	id?: number | string;
	name?: string;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollectionFirst = `${collectionFirst}_${pkType}`;

					await DeleteCollection(vendor, { collection: localCollectionFirst });

					await CreateCollection(vendor, {
						collection: localCollectionFirst,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionFirst,
						field: 'name',
						type: 'string',
					});

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300_000,
	);
};
