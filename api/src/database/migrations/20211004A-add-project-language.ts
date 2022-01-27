import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_language').notNullable().defaultTo('en-US');
	});
	await knex.schema.alterTable('directus_users', (table) => {
		table.string('language').defaultTo(null).alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('project_language');
	});
	await knex.schema.alterTable('directus_users', (table) => {
		table.string('language').defaultTo('en-US').alter();
	});
}
