import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		// JSON column for storing external MCP server configurations
		// Schema: Array<{ id, name, url, enabled, auth?, toolApproval }>
		table.json('ai_mcp_external_servers');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('ai_mcp_external_servers');
	});
}
