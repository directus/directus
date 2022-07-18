import vendors from '@common/get-dbs-to-test';
import { DeleteCollection } from '@common/functions';

export const collectionName = 'common_test_collection';
export const collectionNameM2O = 'common_test_collection_m2o';
export const collectionNameO2M = 'common_test_collection_o2m';

export const seedDBStructure = () => {
	it.each(vendors)('%s', async (vendor) => {
		try {
			// Delete existing collections
			await DeleteCollection(vendor, { collection: collectionNameO2M });
			await DeleteCollection(vendor, { collection: collectionNameM2O });
			await DeleteCollection(vendor, { collection: collectionName });

			expect(true).toBeTruthy();
		} catch (error) {
			expect(error).toBeFalsy();
		}
	});
};
