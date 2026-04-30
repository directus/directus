import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('license_key').nullable().defaultTo(null);
		table.string('license_token').nullable().defaultTo(null);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('license_key');
		table.dropColumn('license_token');
	});
}
