import vendors from '@common/get-dbs-to-test';
import { CreateCollection, CreateField, CreateFieldM2O, DeleteCollection } from '@common/functions';

export const collectionArtists = 'test_items_no_relations_artists';
export const collectionGuests = 'test_items_no_relations_guests';
export const collectionEvents = 'test_items_no_relations_events';
export const collectionArtistsEvents = 'test_items_no_relations_artists_events';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				// Delete existing collections
				await DeleteCollection(vendor, { collection: collectionArtistsEvents });
				await DeleteCollection(vendor, { collection: collectionEvents });
				await DeleteCollection(vendor, { collection: collectionGuests });
				await DeleteCollection(vendor, { collection: collectionArtists });

				// Create artists collection
				await CreateCollection(vendor, {
					collection: collectionArtists,
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionArtists,
					field: 'name',
					type: 'string',
					meta: {},
					schema: {},
				});

				// Create guests collection
				await CreateCollection(vendor, {
					collection: collectionGuests,
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionGuests,
					field: 'name',
					type: 'string',
					meta: {},
					schema: {},
				});

				await CreateFieldM2O(vendor, {
					collection: collectionGuests,
					field: 'favorite_artist',
					fieldMeta: {},
					fieldSchema: {},
					primaryKeyType: 'integer',
					otherCollection: collectionArtists,
					relationMeta: {},
					relationSchema: {},
				});

				// Create events collection
				await CreateCollection(vendor, {
					collection: collectionEvents,
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionEvents,
					field: 'description',
					type: 'string',
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionEvents,
					field: 'cost',
					type: 'integer',
					meta: {},
					schema: {},
				});

				// Create artists_events collection
				await CreateCollection(vendor, {
					collection: collectionArtistsEvents,
					meta: {},
					schema: {},
				});

				await CreateFieldM2O(vendor, {
					collection: collectionArtistsEvents,
					field: 'artists_id',
					fieldMeta: {},
					fieldSchema: {},
					primaryKeyType: 'integer',
					otherCollection: collectionArtists,
					relationMeta: {},
					relationSchema: {},
				});

				await CreateFieldM2O(vendor, {
					collection: collectionArtistsEvents,
					field: 'events_id',
					fieldMeta: {},
					fieldSchema: {},
					primaryKeyType: 'integer',
					otherCollection: collectionEvents,
					relationMeta: {},
					relationSchema: {},
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000
	);
};
