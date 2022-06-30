exports.seed = async function (knex) {
	await knex('directus_collections').del();
	return await knex('directus_collections').insert([
		{ collection: 'artists' },
		{ collection: 'artists_events' },
		{ collection: 'events' },
		{ collection: 'guests' },
		{ collection: 'tours' },
		{ collection: 'tours_components' },
		{ collection: 'organizers' },
		{ collection: 'schema_date_types' },
	]);
};
