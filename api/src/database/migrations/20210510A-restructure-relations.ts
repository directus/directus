import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumns('many_primary', 'one_primary');
		table.string('one_deselect_action').defaultTo('nullify');
		table.string('sort_field', 64).alter();
	});

	await knex('directus_relations').update({ one_deselect_action: 'nullify' });

	await knex.schema.alterTable('directus_relations', (table) => {
		table.string('one_deselect_action').notNullable().defaultTo('nullify').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumn('one_deselect_action');
		table.string('many_primary', 64);
		table.string('one_primary', 64);
		table.string('sort_field', 255).alter();
	});
}
