import { Knex } from 'knex';

export async function up(knex: Knex) {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.jsonb('basemaps');
	});
}

export async function down(knex: Knex) {
	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.dropColumn('basemaps');
	});
}
