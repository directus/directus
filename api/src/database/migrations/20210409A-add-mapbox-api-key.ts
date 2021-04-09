import { Knex } from 'knex';

export async function up(knex: Knex) {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('mapbox_key');
	});
}

export async function down(knex: Knex) {
	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.dropColumn('mapbox_key');
	});
}
