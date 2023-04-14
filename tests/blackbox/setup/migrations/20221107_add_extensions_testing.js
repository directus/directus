exports.up = async function (knex) {
	await knex.schema.createTable('tests_extensions_log', (table) => {
		table.increments('id').primary();
		table.string('key');
		table.string('value');
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTable('tests_extensions_log');
};
