exports.up = function (knex) {
	knex.schema.createTable('artists', (table) => {
		table.increments('id').primary();
		table.string('name');
		table.json('members');
	});
	knex.schema.createTable('guests', (table) => {
		table.uuid('id').primary();
		table.string('name');
		table.date('birthday');
		table.specificType('search_radius', 'geometry(search_radius, 4326)');
		table.time('earliest_events_to_show');
		table.time('latest_events_to_show');
		table.string('password');
		table.integer('shows_attended');
	});
	knex.schema.createTable('events', (table) => {
		table.increments('id').primary();
		table.timestamp('created_at');
		table.float('cost');
		table.text('description');
		table.specificType('location', 'geometry(point, 4326)');
		table.text('tags'); // insert csv content
		table.time('time');
	});
	knex.schema.createTable('tours', (table) => {
		table.increments('id').primary();
		table.bigInteger('revenueEstimated');
		table.specificType('route', 'geometry(linestring, 4326)');
		table.specificType('map_of_stops', 'geometry(multipoint, 4326)');
		table.specificType('area_of_reach', 'geometry(multipolygon, 4326)');
		table.specificType('revenue_of_shows_by_month', 'geometry(mutlinestring, 4326'); // insert multilineString
	});
	knex.schema.createTable('organizers', (table) => {
		table.increments('id').primary();
		table.string('company_name');
	});
};

exports.down = function (knex) {
	knex.schema.dropTable('guests');
	knex.schema.dropTable('artists');
	knex.schema.dropTable('events');
	knex.schema.dropTable('organizers');
	knex.schema.dropTable('tours');
};
