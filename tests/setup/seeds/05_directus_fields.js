exports.seed = async function (knex) {
	await knex('directus_fields').del();
	return await knex('directus_fields').insert([
		{
			collection: 'artists',
			field: 'events',
			special: 'm2m',
		},
		{
			collection: 'events',
			field: 'artists',
			special: 'm2m',
		},
	]);
};
