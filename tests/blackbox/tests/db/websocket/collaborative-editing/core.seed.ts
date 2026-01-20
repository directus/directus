import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionCollabCore = 'test_collab_core';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionCollabCore });

				// Create collection
				await CreateCollection(vendor, {
					collection: collectionCollabCore,
					primaryKeyType: 'uuid',
					meta: { versioning: true },
				});

				// Create fields
				await CreateField(vendor, { collection: collectionCollabCore, field: 'title', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabCore, field: 'content', type: 'text' });
				await CreateField(vendor, { collection: collectionCollabCore, field: 'notes', type: 'text' });

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};
