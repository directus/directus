exports.seed = function (knex) {
	return knex('directus_relations').insert([
		{
			many_collection: 'guests',
			many_field: 'favorite_artists',
			one_collection: 'artists',
		},
		{
			many_collection: 'artists',
			many_field: 'id',
			one_collection: 'artists_events',
			one_field: 'artist_id',
		},
		{
			many_collection: 'events',
			many_field: 'id',
			one_collection: 'artists_events',
			one_field: 'events_id',
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
	]);
};
