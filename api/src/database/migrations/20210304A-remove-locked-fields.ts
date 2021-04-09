import { Knex } from 'knex';

export async function up(knex: Knex) {
	await knex.schema.alterTable('directus_fields', (table) => {
		table.dropColumn('locked');
	});
}

export async function down(knex: Knex) {
	await knex.schema.alterTable('directus_fields', (table) => {
		table.boolean('locked').defaultTo(false).notNullable();
	});
}
