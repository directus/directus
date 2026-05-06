import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.string('status').notNullable().defaultTo('active');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.dropColumn('status');
	});
}
