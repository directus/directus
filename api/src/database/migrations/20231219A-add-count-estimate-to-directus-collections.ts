import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.integer('count_estimate').defaultTo(0);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.dropColumn('count_estimate');
	});
}
