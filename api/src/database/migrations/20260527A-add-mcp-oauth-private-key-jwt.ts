import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_oauth_clients', (table) => {
		table.string('jwks_uri', 255).nullable();
		table.string('token_endpoint_auth_signing_alg').nullable();
	});

	await knex.schema.createTable('directus_oauth_client_assertions', (table) => {
		table.string('jti_hash', 64).primary().notNullable();

		table
			.string('client', 255)
			.notNullable()
			.references('client_id')
			.inTable('directus_oauth_clients')
			.onDelete('CASCADE')
			.index();

		table.timestamp('expires_at').notNullable().index();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_oauth_client_assertions');

	await knex.schema.alterTable('directus_oauth_clients', (table) => {
		table.dropColumn('jwks_uri');
		table.dropColumn('token_endpoint_auth_signing_alg');
	});
}
