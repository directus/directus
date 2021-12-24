exports.up = async function (knex) {
	await knex.schema.createTable('artists_events', (table) => {
		table.increments('id').primary();
		table.uuid('artists_id').references('id').inTable('artists');
		table.uuid('events_id').references('id').inTable('events');
	});
	await knex.schema.createTable('tours_components', (table) => {
		table.increments('id').primary();
		table.uuid('tours_id').references('id').inTable('tours');
		table.uuid('item');
		table.string('collection');
	});
	await knex.schema.createTable('guests_events', (table) => {
		table.increments('id').primary();
		table.uuid('guests_id').references('id').inTable('artists');
		table.uuid('event_id').references('id').inTable('events');
		table.float('match_rating');
		table.boolean('rsvp');
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTable('artists_events');
	await knex.schema.dropTable('guests_events');
	await knex.schema.dropTable('tours_components');
};
