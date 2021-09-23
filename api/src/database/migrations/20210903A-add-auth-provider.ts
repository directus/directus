import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.string('provider', 128).notNullable().defaultTo('default');
		table.string('external_identifier', 512).unique();
		table.json('auth_data');

		table.string('email', 128).nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('provider');
		table.dropColumn('external_identifier');
		table.dropColumn('auth_data');

		table.string('email', 128).notNullable().alter();
	});
}
