exports.seed = async function (knex) {
	await knex('directus_relations').del();
	return await knex('directus_relations').insert([
		{
			many_collection: 'guests',
			many_field: 'favorite_artist',
			one_collection: 'artists',
		},
		{ many_collection: 'artists_events', many_field: 'events_id', one_collection: 'artists' },
		{
			many_collection: 'artists_events',
			many_field: 'events_id',
			one_collection: 'events',
			one_field: 'artists',
			junction_field: 'artists_id',
		},
		{
			many_collection: 'artists_events',
			many_field: 'artists_id',
			one_collection: 'artists',
			one_field: 'events',
			junction_field: 'events_id',
		},
	]);
};
