exports.seed = function (knex) {
	return knex('directus_collections').insert([
		{ collection: 'artists' },
		{ collection: 'events' },
		{ collection: 'guests' },
		{ collection: 'tours' },
		{ collection: 'organizers' },
	]);
};
