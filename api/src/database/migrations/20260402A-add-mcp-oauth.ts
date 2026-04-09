import type { Knex } from 'knex';

/**
 * Create MCP OAuth tables in FK-dependency order:
 * 1. `directus_oauth_clients` -- no FKs
 * 2. `directus_oauth_consents` -- FKs to users + clients, unique(user, client, redirect_uri)
 * 3. `directus_oauth_codes` -- FKs to users + clients, unique code_hash
 * 4. `directus_oauth_tokens` -- FKs to users + clients, unique(client, user), session index
 * 5. `directus_sessions.oauth_client` -- nullable FK to clients (identifies OAuth sessions)
 */
export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_oauth_clients', (table) => {
		table.uuid('client_id').primary().notNullable();
		table.string('client_name', 200).notNullable();
		table.json('redirect_uris').notNullable();
		table.json('grant_types').notNullable();
		table.string('token_endpoint_auth_method').notNullable().defaultTo('none');
		table.timestamp('date_created').notNullable().defaultTo(knex.fn.now());
	});

	await knex.schema.createTable('directus_oauth_consents', (table) => {
		table.uuid('id').primary().notNullable();
		table.uuid('user').notNullable().references('id').inTable('directus_users').onDelete('CASCADE');
		table.uuid('client').notNullable().references('client_id').inTable('directus_oauth_clients').onDelete('CASCADE');
		table.string('redirect_uri', 255).notNullable();
		table.string('scope').nullable();
		table.timestamp('date_created').notNullable();
		table.timestamp('date_updated').notNullable();
		table.unique(['user', 'client', 'redirect_uri']);
	});

	await knex.schema.createTable('directus_oauth_codes', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('code_hash', 64).notNullable().unique();
		table.uuid('client').notNullable().references('client_id').inTable('directus_oauth_clients').onDelete('CASCADE');
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
		table.uuid('client').notNullable().references('client_id').inTable('directus_oauth_clients').onDelete('CASCADE');
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
			.uuid('oauth_client')
			.nullable()
			.references('client_id')
			.inTable('directus_oauth_clients')
			.onDelete('CASCADE')
			.index();
	});
}

/** Drop in reverse FK-dependency order: column first, then tables. */
export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropForeign('oauth_client');
		table.dropColumn('oauth_client');
	});

	await knex.schema.dropTable('directus_oauth_tokens');
	await knex.schema.dropTable('directus_oauth_codes');
	await knex.schema.dropTable('directus_oauth_consents');
	await knex.schema.dropTable('directus_oauth_clients');
}
