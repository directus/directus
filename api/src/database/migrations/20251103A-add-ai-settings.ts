import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.text('ai_openai_api_key');
		table.text('ai_anthropic_api_key');
		table.text('ai_system_prompt');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('ai_openai_api_key');
		table.dropColumn('ai_anthropic_api_key');
		table.dropColumn('ai_system_prompt');
	});
}
