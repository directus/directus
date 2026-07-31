// Adds the shared `gate_tripped` flag to tests_flow_data. The first file whose sequential-gate
// backstop trips sets this true, so every other waiting file proceeds at once rather than each
// waiting out the backstop in turn.

export async function up(knex) {
	const hasColumn = await knex.schema.hasColumn('tests_flow_data', 'gate_tripped');

	if (!hasColumn) {
		await knex.schema.alterTable('tests_flow_data', (table) => {
			table.boolean('gate_tripped').defaultTo(false);
		});
	}
}

export async function down(knex) {
	const hasColumn = await knex.schema.hasColumn('tests_flow_data', 'gate_tripped');

	if (hasColumn) {
		await knex.schema.alterTable('tests_flow_data', (table) => {
			table.dropColumn('gate_tripped');
		});
	}
}
