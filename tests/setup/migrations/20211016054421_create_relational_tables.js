exports.up = async function (knex) {
	await knex.schema.createTable('artists_events', (table) => {
		table.increments('id');
		table.integer('artists_id').unsigned().references('id').inTable('artists');
		table.integer('events_id').unsigned().references('id').inTable('events');
	});
	await knex.schema.createTable('tours_components', (table) => {
		table.integer('id').primary();
		table.integer('tours_id').unsigned().references('id').inTable('tours');
		table.integer('item');
		table.string('collection');
	});
	await knex.schema.createTable('guests_events', (table) => {
		table.increments('id');
		table.integer('guests_id').unsigned().references('id').inTable('artists');
		table.integer('event_id').unsigned().references('id').inTable('events');
		table.float('match_rating');
		table.boolean('rsvp');
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTable('artists_events');
	await knex.schema.dropTable('guests_events');
	await knex.schema.dropTable('tours_components');
};
