export async function up(knex) {
	await knex.schema.createTable('tests_extensions_log', (table) => {
		table.increments('id').primary();
		table.string('key');
		table.string('value');
	});
}

export async function down(knex) {
	await knex.schema.dropTable('tests_extensions_log');
}
