import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_oauth_clients', (table) => {
		table.string('client_secret_hash', 64).nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_oauth_clients', (table) => {
		table.dropColumn('client_secret_hash');
	});
}
