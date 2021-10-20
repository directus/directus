exports.up = async function (knex) {
	await knex.schema.createTable('artists', (table) => {
		table.increments('id').primary();
		table.string('name');
		table.json('members');
	});
	await knex.schema.createTable('guests', (table) => {
		table.uuid('id').primary();
		table.string('name');
		table.date('birthday');
		table.time('earliest_events_to_show');
		table.time('latest_events_to_show');
		table.string('password');
		table.integer('shows_attended');
	});
	await knex.schema.createTable('events', (table) => {
		table.increments('id').primary();
		table.timestamp('created_at');
		table.float('cost');
		table.text('description');
		table.text('tags');
		table.time('time');
	});
	await knex.schema.createTable('tours', (table) => {
		table.increments('id').primary();
		table.bigInteger('revenue');
	});
	await knex.schema.createTable('organizers', (table) => {
		table.increments('id').primary();
		table.string('company_name');
	});
};

exports.down = function (knex, Promise) {
	Promise.all([
		knex.schema.dropTable('guests'),
		knex.schema.dropTable('artists'),
		knex.schema.dropTable('events'),
		knex.schema.dropTable('organizers'),
		knex.schema.dropTable('tours'),
	]);
};
