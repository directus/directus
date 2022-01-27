exports.up = async function (knex) {
	await knex.schema.createTable('tests_flow_data', (table) => {
		table.increments('id').primary();
		table.string('total_tests_count');
	});
	await knex.schema.createTable('tests_flow_completed', (table) => {
		table.increments('id').primary();
		table.string('test_file_path');
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTable('tests_flow_data');
	await knex.schema.dropTable('tests_flow_completed');
};
