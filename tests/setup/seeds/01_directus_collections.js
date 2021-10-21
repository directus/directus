exports.seed = function (knex) {
	return knex('directus_collections').insert([
		{ collection: 'artists' },
		{ collection: 'artists_events' },
		{ collection: 'events' },
		{ collection: 'guests' },
		{ collection: 'tours' },
		{ collection: 'tours_components' },
		{ collection: 'organizers' },
	]);
};
