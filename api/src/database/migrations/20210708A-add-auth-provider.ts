import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.string('provider', 128);
		table.string('provider_key', 512);
		table.text('provider_data');
		table.unique(['provider', 'provider_key']);

		table.string('email', 128).nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropUnique(['provider', 'provider_key']);
		table.dropColumn('provider');
		table.dropColumn('provider_key');
		table.dropColumn('provider_data');

		table.string('email', 128).notNullable().alter();
	});
}
