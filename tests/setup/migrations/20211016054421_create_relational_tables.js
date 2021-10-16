exports.up = function (knex) {
	knex.schema.createTable('artists_events', (table) => {
		table.increments('id');
		table.integer('artist_id').unsigned().references('id').inTable('artists');
		table.integer('event_id').unsigned().references('id').inTable('events');
	});
	knex.schema.createTable('tours_components', (table) => {
		table.integer('id').primary();
		table.integer('tour_id').unsigned().references('id').inTable('tours');
		table.integer('item');
		table.string('collection');
	});
};

exports.down = function (knex) {
	knex.schema.dropTable('artists_events');
	knex.schema.dropTable('tours_components');
};
