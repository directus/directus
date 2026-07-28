import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('mcp_oauth_enabled').defaultTo(false).notNullable();
		table.boolean('mcp_oauth_dcr_enabled').defaultTo(false).notNullable();
		table.boolean('mcp_oauth_cimd_enabled').defaultTo(false).notNullable();
	});

	await knex.schema.createTable('directus_oauth_clients', (table) => {
		table.string('client_id', 255).primary().notNullable();
		table.string('client_name', 200).notNullable();
		table.json('redirect_uris').notNullable();
		table.json('grant_types').notNullable();
		table.string('token_endpoint_auth_method').notNullable().defaultTo('none');
		table.string('client_secret_hash', 64).nullable();
		table.string('registration_type', 10).notNullable().defaultTo('dcr');
		table.text('client_uri').nullable();
		table.text('logo_uri').nullable();
		table.text('tos_uri').nullable();
		table.text('policy_uri').nullable();
		table.timestamp('metadata_fetched_at').nullable();
		table.timestamp('metadata_expires_at').nullable();
		table.string('metadata_etag', 255).nullable();
		table.timestamp('date_created').notNullable().defaultTo(knex.fn.now()).index();
	});

	await knex.schema.createTable('directus_oauth_consents', (table) => {
		table.uuid('id').primary().notNullable();
		table.uuid('user').notNullable().references('id').inTable('directus_users').onDelete('CASCADE');

		table
			.string('client', 255)
			.notNullable()
			.references('client_id')
			.inTable('directus_oauth_clients')
			.onDelete('CASCADE');

		table.string('redirect_uri', 255).notNullable();
		table.string('scope').nullable();
		table.timestamp('date_created').notNullable();
		table.timestamp('date_updated').notNullable();
		table.unique(['user', 'client', 'redirect_uri']);
		table.index('client');
	});

	await knex.schema.createTable('directus_oauth_codes', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('code_hash', 64).notNullable().unique();

		table
			.string('client', 255)
			.notNullable()
			.references('client_id')
			.inTable('directus_oauth_clients')
			.onDelete('CASCADE');

		table.uuid('user').notNullable().references('id').inTable('directus_users').onDelete('CASCADE');
		table.string('redirect_uri', 255).notNullable();
		table.string('resource').notNullable();
		table.string('code_challenge', 128).notNullable();
		table.string('code_challenge_method', 10).notNullable();
		table.string('scope').nullable();
		table.timestamp('expires_at').notNullable().index();
		table.timestamp('used_at').nullable().index();
	});

	await knex.schema.createTable('directus_oauth_tokens', (table) => {
		table.uuid('id').primary().notNullable();

		table
			.string('client', 255)
			.notNullable()
			.references('client_id')
			.inTable('directus_oauth_clients')
			.onDelete('CASCADE');

		table.uuid('user').notNullable().references('id').inTable('directus_users').onDelete('CASCADE');
		table.string('session', 64).notNullable().index();
		table.string('previous_session', 64).nullable().index();
		table.string('resource').notNullable();
		table.string('code_hash', 64).notNullable().index();
		table.string('scope').nullable();
		table.timestamp('expires_at').notNullable().index();
		table.timestamp('date_created').notNullable();
		table.unique(['client', 'user']);
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table
			.string('oauth_client', 255)
			.nullable()
			.references('client_id')
			.inTable('directus_oauth_clients')
			.onDelete('CASCADE')
			.index();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropForeign('oauth_client');
		table.dropColumn('oauth_client');
	});

	await knex.schema.dropTable('directus_oauth_tokens');
	await knex.schema.dropTable('directus_oauth_codes');
	await knex.schema.dropTable('directus_oauth_consents');
	await knex.schema.dropTable('directus_oauth_clients');

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('mcp_oauth_enabled');
		table.dropColumn('mcp_oauth_dcr_enabled');
		table.dropColumn('mcp_oauth_cimd_enabled');
	});
}
