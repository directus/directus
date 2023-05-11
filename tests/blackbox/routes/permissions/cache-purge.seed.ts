import vendors from '@common/get-dbs-to-test';
import { CreateCollection, CreateField, DeleteCollection } from '@common/index';

export const collection = 'test_perms_cache_purge';

export type Collection = {
	id?: number;
	string_field?: string;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collection });

				// Create collection
				await CreateCollection(vendor, {
					collection,
				});

				await CreateField(vendor, {
					collection,
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
