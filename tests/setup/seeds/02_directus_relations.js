exports.seed = function (knex) {
	return knex('directus_relations').insert([
		{
			many_collection: 'guests',
			many_field: 'favorite_artist',
			one_collection: 'artists',
		},
	]);
};
