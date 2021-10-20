exports.seed = function (knex) {
	return knex('directus_relations').insert([
		{
			many_collection: 'guests',
			many_field: 'favorite_artists',
			one_collection: 'artists',
		},
		{
			many_collection: 'artists_events',
			many_field: 'artists_id',
			one_collection: 'artists_events',
			one_field: 'id',
		},
		{
			many_collection: 'artists_events',
			many_field: 'events_id',
			one_collection: 'events',
			one_field: 'id',
		},
		{
			many_collection: 'guests_events',
			many_field: 'guest_id',
			one_collection: 'guests',
			one_field: 'id',
		},
		{
			many_collection: 'guests_events',
			many_field: 'events_id',
			one_collection: 'events',
			one_field: 'id',
		},
		{
			many_collection: 'tours_components',
			many_field: 'item',
			one_collection_field: 'collection',
			one_field: 'id',
			one_allowed_collections: 'events,artists,organizers',
			junction_field: 'tours_id',
		},
		{
			many_collection: 'tours_components',
			many_field: 'tours_id',
			one_collection_field: 'tours',
			one_field: 'components',
			junction_field: 'item',
		},
	]);
};
