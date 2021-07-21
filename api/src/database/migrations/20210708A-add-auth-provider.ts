import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.string('provider', 128).notNullable().defaultTo('default');
		table.string('provider_key', 512).unique('provider_key');
		table.text('provider_data');

		table.string('email', 128).nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('provider');
		table.dropColumn('provider_key');
		table.dropColumn('provider_data');

		table.string('email', 128).notNullable().alter();
	});
}
