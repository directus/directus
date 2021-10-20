exports.up = function (knex) {
	knex.schema.createTable('artists_events', (table) => {
		table.increments('id');
		table.integer('artists_id').unsigned().references('id').inTable('artists');
		table.integer('events_id').unsigned().references('id').inTable('events');
	});
	knex.schema.createTable('tours_components', (table) => {
		table.integer('id').primary();
		table.integer('tours_id').unsigned().references('id').inTable('tours');
		table.integer('item');
		table.string('collection');
	});
	knex.schema.createTable('guests_events', (table) => {
		table.increments('id');
		table.integer('guests_id').unsigned().references('id').inTable('artists');
		table.integer('event_id').unsigned().references('id').inTable('events');
		table.float('matchRating');
		table.boolean('rsvp');
	});
};

exports.down = function (knex) {
	knex.schema.dropTable('artists_events');
	knex.schema.dropTable('guests_events');
	knex.schema.dropTable('tours_components');
};
