import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('mcp_enabled').defaultTo(false).notNullable();
		table.boolean('mcp_allow_deletes').defaultTo(true).notNullable();
		table.string('mcp_prompts_collection').defaultTo(null).nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('mcp_enabled');
		table.dropColumn('mcp_allow_deletes');
		table.dropChecks('mcp_prompts_collection');
	});
}
