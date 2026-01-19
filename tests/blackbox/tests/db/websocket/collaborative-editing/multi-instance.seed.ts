import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionCollabMultiInstance = 'test_collab_multi_instance';

export const seedDBStructure = () => {
	it.each(vendors)('%s', async (vendor) => {
		try {
			// Delete existing collections
			await DeleteCollection(vendor, { collection: collectionCollabMultiInstance });

			// Create collection
			await CreateCollection(vendor, { collection: collectionCollabMultiInstance, primaryKeyType: 'uuid' });

			// Create fields
			await CreateField(vendor, { collection: collectionCollabMultiInstance, field: 'title', type: 'string' });
			await CreateField(vendor, { collection: collectionCollabMultiInstance, field: 'content', type: 'text' });

			expect(true).toBeTruthy();
		} catch (error) {
			expect(error).toBeFalsy();
		}
	});
};
