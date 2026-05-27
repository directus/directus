import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('mcp_enabled').defaultTo(false).notNullable();
		table.boolean('mcp_allow_deletes').defaultTo(false).notNullable();
		table.string('mcp_prompts_collection').defaultTo(null).nullable();
		table.boolean('mcp_system_prompt_enabled').defaultTo(true).notNullable();
		table.text('mcp_system_prompt').defaultTo(null).nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('mcp_enabled');
		table.dropColumn('mcp_allow_deletes');
		table.dropColumn('mcp_prompts_collection');
		table.dropColumn('mcp_system_prompt_enabled');
		table.dropColumn('mcp_system_prompt');
	});
}
