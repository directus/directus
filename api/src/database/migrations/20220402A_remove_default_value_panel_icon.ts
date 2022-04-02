import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_panels', (table) => {
		table.string('icon').nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_panels', (table) => {
		table.string('icon').notNullable().defaultTo('insert_chart').alter();
	});
}
