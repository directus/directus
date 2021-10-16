exports.seed = function (knex) {
	return knex('directus_relations').insert([
		{
			id: 1,
			many_collection: 'artists',
			many_field: 'id',
			one_collection: 'guests',
			one_field: 'favorite_artists',
		},
		{
			id: 2,
			many_collection: 'artists',
			many_field: 'id',
			one_collection: 'artists_events',
			one_field: 'artist_id',
		},
		{
			id: 3,
			many_collection: 'events',
			many_field: 'id',
			one_collection: 'artists_events',
			one_field: 'events_id',
		},
		{
			id: 2,
			many_collection: 'guests',
			many_field: 'id',
			one_collection: 'guests_events',
			one_field: 'guests_id',
		},
		{
			id: 3,
			many_collection: 'events',
			many_field: 'id',
			one_collection: 'guests_events',
			one_field: 'events_id',
		},
	]);
};
