import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_notifications', (table) => {
		table.setNullable('sender');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_notifications', (table) => {
		table.dropNullable('sender');
	});
}
