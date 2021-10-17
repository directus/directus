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
		table.string('search_radius'); //insert geoPoly
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
		table.string('route'); // insert geoLine
		table.string('map_of_stops'); // insert geoMultiPoint
		table.string('area_of_reach'); // insert geoMultiPoly
		table.string('revenue_of_shows_by_month'); // insert multilineString
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
