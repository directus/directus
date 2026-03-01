import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionCollabSingleton = 'test_collab_singleton';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionCollabSingleton });

				// Create collection
				await CreateCollection(vendor, {
					collection: collectionCollabSingleton,
					schema: { name: collectionCollabSingleton },
					meta: { singleton: true },
				});

				// Create fields
				await CreateField(vendor, {
					collection: collectionCollabSingleton,
					field: 'title',
					type: 'string',
					schema: {},
					meta: { interface: 'input', special: null },
				});

				await CreateField(vendor, {
					collection: collectionCollabSingleton,
					field: 'is_published',
					type: 'boolean',
					schema: { default_value: true },
					meta: { interface: 'boolean', special: null },
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};
