import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.integer('sort');
		table.string('group', 64).references('collection').inTable('directus_collections');
		table.string('collapse').defaultTo('open').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.dropColumn('sort');
		table.dropColumn('group');
		table.dropColumn('collapse');
	});
}
