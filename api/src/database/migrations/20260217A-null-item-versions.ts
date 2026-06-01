import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_versions', (table) => {
		table.string('item').nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_versions', (table) => {
		table.string('item').notNullable().alter();
	});
}
