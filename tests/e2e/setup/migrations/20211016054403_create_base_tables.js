exports.up = async function (knex) {
	await knex.schema.createTable('artists', (table) => {
		table.uuid('id').primary();
		table.string('name');
		table.json('members');
	});
	await knex.schema.createTable('guests', (table) => {
		table.uuid('id').primary();
		table.string('name');
		table.date('birthday');
		table.string('search_radius');
		table.time('earliest_events_to_show');
		table.time('latest_events_to_show');
		table.string('password');
		table.integer('shows_attended');
		table.uuid('favorite_artist').references('id').inTable('artists');
	});
	await knex.schema.createTable('events', (table) => {
		table.uuid('id').primary();
		table.timestamp('created_at');
		table.float('cost');
		table.text('description');
		table.text('tags');
		table.time('time');
	});
	await knex.schema.createTable('tours', (table) => {
		table.uuid('id').primary();
		table.bigInteger('revenue');
	});
	await knex.schema.createTable('organizers', (table) => {
		table.uuid('id').primary();
		table.string('company_name');
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTable('guests');
	await knex.schema.dropTable('artists');
	await knex.schema.dropTable('events');
	await knex.schema.dropTable('organizers');
	await knex.schema.dropTable('tours');
};
