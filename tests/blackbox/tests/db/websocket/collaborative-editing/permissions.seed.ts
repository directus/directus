import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionCollabPrivate = 'test_collab_editing_private';
export const collectionCollab = 'test_collab_editing';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionCollabPrivate });
				await DeleteCollection(vendor, { collection: collectionCollab });

				// Create collections
				await CreateCollection(vendor, { collection: collectionCollabPrivate, primaryKeyType: 'uuid' });

				await CreateCollection(vendor, {
					collection: collectionCollab,
					primaryKeyType: 'uuid',
					meta: { versioning: true },
				});

				// Create fields
				await CreateField(vendor, { collection: collectionCollabPrivate, field: 'secret', type: 'string' });
				await CreateField(vendor, { collection: collectionCollab, field: 'title', type: 'string' });
				await CreateField(vendor, { collection: collectionCollab, field: 'content', type: 'text' });

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};
