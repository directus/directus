import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_oauth_clients', (table) => {
		table.string('registration_type', 10).notNullable().defaultTo('dcr');
		table.text('client_uri').nullable();
		table.text('logo_uri').nullable();
		table.text('tos_uri').nullable();
		table.text('policy_uri').nullable();
		table.timestamp('metadata_fetched_at').nullable();
		table.timestamp('metadata_expires_at').nullable();
		table.string('metadata_etag', 255).nullable();
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('mcp_oauth_dcr_enabled').defaultTo(true);
		table.boolean('mcp_oauth_cimd_enabled').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_oauth_clients', (table) => {
		table.dropColumn('registration_type');
		table.dropColumn('client_uri');
		table.dropColumn('logo_uri');
		table.dropColumn('tos_uri');
		table.dropColumn('policy_uri');
		table.dropColumn('metadata_fetched_at');
		table.dropColumn('metadata_expires_at');
		table.dropColumn('metadata_etag');
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('mcp_oauth_dcr_enabled');
		table.dropColumn('mcp_oauth_cimd_enabled');
	});
}
