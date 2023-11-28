export async function seed(knex) {
	await knex('tests_extensions_log').del();
}
