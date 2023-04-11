import vendors from '@common/get-dbs-to-test';
import { CreateCollection, DeleteCollection, PRIMARY_KEY_TYPES } from '@common/index';

export const collection = 'test_fields_crud';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollection = `${collection}_${pkType}`;

					// Delete existing collections
					await DeleteCollection(vendor, { collection: localCollection });

					// Create countries collection
					await CreateCollection(vendor, {
						collection: localCollection,
						primaryKeyType: pkType,
					});

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300000
	);
};
