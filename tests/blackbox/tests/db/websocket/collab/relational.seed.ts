import {
	CreateCollection,
	CreateField,
	CreateFieldM2A,
	CreateFieldM2M,
	CreateFieldM2O,
	CreateFieldO2M,
	DeleteCollection,
} from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { expect, it } from 'vitest';

export const collectionCollabRelational = 'test_collab_relational';
export const collectionCollabRelationalO2M = 'test_collab_relational_o2m';
export const collectionCollabRelationalDeepO2M = 'test_collab_relational_deep_o2m';
export const collectionCollabRelationalM2O = 'test_collab_relational_m2o';
export const collectionCollabRelationalM2MJunction = 'test_collab_relational_jm2m';
export const collectionCollabRelationalM2M = 'test_collab_relational_m2m';
export const collectionCollabRelationalA2OJunction = 'test_collab_relational_ja2o';
export const collectionCollabRelationalA2O = 'test_collab_relational_a2o';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionCollabRelationalA2OJunction });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalM2MJunction });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalDeepO2M });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalO2M });
				await DeleteCollection(vendor, { collection: collectionCollabRelational });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalA2O });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalM2M });
				await DeleteCollection(vendor, { collection: collectionCollabRelationalM2O });

				// Create collections
				await CreateCollection(vendor, { collection: collectionCollabRelational, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalO2M, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalDeepO2M, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalM2O, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalM2M, primaryKeyType: 'uuid' });
				await CreateCollection(vendor, { collection: collectionCollabRelationalA2O, primaryKeyType: 'uuid' });

				// Create fields for main collection
				await CreateField(vendor, { collection: collectionCollabRelational, field: 'name', type: 'string' });

				// Create M2O related collection fields
				await CreateField(vendor, { collection: collectionCollabRelationalM2O, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2O, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2O, field: 'field_b', type: 'string' });

				// Create M2O relationship (main -> m2o_related)
				await CreateFieldM2O(vendor, {
					collection: collectionCollabRelational,
					field: 'm2o_related',
					primaryKeyType: 'uuid',
					otherCollection: collectionCollabRelationalM2O,
				});

				// Create O2M related collection fields
				await CreateField(vendor, { collection: collectionCollabRelationalO2M, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalO2M, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalO2M, field: 'field_b', type: 'string' });

				// Create O2M relationship (main -> children)
				await CreateFieldO2M(vendor, {
					collection: collectionCollabRelational,
					field: 'o2m_related',
					otherCollection: collectionCollabRelationalO2M,
					otherField: 'parent_id',
					primaryKeyType: 'uuid',
				});

				// Create Deep O2M related collection fields
				await CreateField(vendor, { collection: collectionCollabRelationalDeepO2M, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalDeepO2M, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalDeepO2M, field: 'field_b', type: 'string' });

				// Create Deep O2M relationship (o2m_related -> grandchildren)
				await CreateFieldO2M(vendor, {
					collection: collectionCollabRelationalO2M,
					field: 'deep_o2m_related',
					otherCollection: collectionCollabRelationalDeepO2M,
					otherField: 'parent_id',
					primaryKeyType: 'uuid',
				});

				// Create M2M related collection fields
				await CreateField(vendor, { collection: collectionCollabRelationalM2M, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2M, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalM2M, field: 'field_b', type: 'string' });

				// Create M2M relationship (main <-> m2m_related)
				await CreateFieldM2M(vendor, {
					collection: collectionCollabRelational,
					field: 'm2m_related',
					otherCollection: collectionCollabRelationalM2M,
					otherField: 'parents',
					junctionCollection: collectionCollabRelationalM2MJunction,
					primaryKeyType: 'uuid',
				});

				// Create A2O related collection fields
				await CreateField(vendor, { collection: collectionCollabRelationalA2O, field: 'name', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalA2O, field: 'field_a', type: 'string' });
				await CreateField(vendor, { collection: collectionCollabRelationalA2O, field: 'field_b', type: 'string' });

				// Create M2A (A2O) relationship (main -> a2o_items pointing to multiple collections)
				await CreateFieldM2A(vendor, {
					collection: collectionCollabRelational,
					field: 'a2o_items',
					relatedCollections: [collectionCollabRelationalA2O, collectionCollabRelationalM2O],
					junctionCollection: collectionCollabRelationalA2OJunction,
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
