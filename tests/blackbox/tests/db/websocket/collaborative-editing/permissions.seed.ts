import { CreateCollection, CreateField, CreateFieldM2O, CreateFieldO2M, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionCollabPrivate = 'test_collab_editing_private';
export const collectionCollab = 'test_collab_editing';
export const collectionCollabSingleton = 'test_collab_editing_singleton';
export const collectionCollabRelational = 'test_collab_editing_relational';
export const collectionCollabRelationalM2O = 'test_collab_editing_relational_m2o';
export const collectionCollabRelationalO2M = 'test_collab_editing_relational_o2m';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionCollabPrivate });
				await DeleteCollection(vendor, { collection: collectionCollab });
				await DeleteCollection(vendor, { collection: collectionCollabSingleton });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalO2M });
				await DeleteCollection(vendor, { collection: collectionCollabRelational });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalM2O });

				// Create collections
				await CreateCollection(vendor, { collection: collectionCollabPrivate, primaryKeyType: 'uuid' });

				await CreateCollection(vendor, {
					collection: collectionCollab,
					primaryKeyType: 'uuid',
					meta: { versioning: true },
				});

				await CreateCollection(vendor, {
					collection: collectionCollabSingleton,
					meta: { singleton: true },
				});

				await CreateCollection(vendor, { collection: collectionCollabRelational, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalM2O, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalO2M, primaryKeyType: 'uuid' });

				// Create fields
				await CreateField(vendor, { collection: collectionCollabPrivate, field: 'secret', type: 'string' });
				await CreateField(vendor, { collection: collectionCollab, field: 'title', type: 'string' });
				await CreateField(vendor, { collection: collectionCollab, field: 'content', type: 'text' });
				await CreateField(vendor, { collection: collectionCollabSingleton, field: 'confidential', type: 'string' });

				await CreateField(vendor, { collection: collectionCollabRelational, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2O, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2O, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2O, field: 'field_b', type: 'string' });

				await CreateField(vendor, { collection: collectionCollabRelationalO2M, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalO2M, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalO2M, field: 'field_b', type: 'string' });

				await CreateFieldM2O(vendor, {
					collection: collectionCollabRelational,
					field: 'm2o_related',
					primaryKeyType: 'uuid',
					otherCollection: collectionCollabRelationalM2O,
				});

				await CreateFieldO2M(vendor, {
					collection: collectionCollabRelational,
					field: 'o2m_related',
					otherCollection: collectionCollabRelationalO2M,
					otherField: 'parent_id',
					primaryKeyType: 'uuid',
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};
