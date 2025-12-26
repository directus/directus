import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const hasSort = await knex.schema.hasColumn('directus_flows', 'sort');
	const hasGroup = await knex.schema.hasColumn('directus_flows', 'group');
	const hasCollapse = await knex.schema.hasColumn('directus_flows', 'collapse');

	await knex.schema.alterTable('directus_flows', (table) => {
		if (!hasSort) {
			table.integer('sort');
		}

		if (!hasGroup) {
			table.uuid('group').references('id').inTable('directus_flows').onDelete('SET NULL');
		}

		if (!hasCollapse) {
			table.string('collapse').defaultTo('open').notNullable();
		}
	});

	// Initialize sort values for existing flows based on alphabetical order
	// This preserves the current name-based ordering as explicit sort values
	if (!hasSort) {
		const flows = await knex('directus_flows').select('id', 'name').orderBy('name', 'asc');

		for (let i = 0; i < flows.length; i++) {
			await knex('directus_flows').where('id', flows[i].id).update({ sort: i + 1 });
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_flows', (table) => {
		table.dropColumn('sort');
		table.dropColumn('group');
		table.dropColumn('collapse');
	});
}
