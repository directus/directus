import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_shares', (table) => {
		table.dropNullable('collection');
		table.dropNullable('item');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_shares', (table) => {
		table.setNullable('collection');
		table.setNullable('item');
	});
}
