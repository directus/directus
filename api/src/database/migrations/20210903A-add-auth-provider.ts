import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropUnique(['email']);
	});

	await knex.schema.alterTable('directus_users', (table) => {
		table.string('provider', 128).notNullable().defaultTo('default');
		table.string('external_identifier').unique();
		table.string('email', 128).nullable().alter();
	});

	await knex.schema.alterTable('directus_users', (table) => {
		table.unique(['email']);
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.json('data');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('provider');
		table.dropColumn('external_identifier');

		table.string('email', 128).notNullable().alter();
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropColumn('data');
	});
}
