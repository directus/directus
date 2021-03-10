import { Knex } from 'knex';

export async function up(knex: Knex) {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.dropForeign(['collection']);
	});
}

export async function down(knex: Knex) {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.foreign('collection').references('directus_collections.collection');
	});
}
