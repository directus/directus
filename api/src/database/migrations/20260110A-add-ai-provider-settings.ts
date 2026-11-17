import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.text('ai_google_api_key');
		table.text('ai_openai_compatible_api_key');
		table.text('ai_openai_compatible_base_url');
		table.text('ai_openai_compatible_name');
		table.json('ai_openai_compatible_models');
		table.json('ai_openai_compatible_headers');
		table.json('ai_openai_allowed_models');
		table.json('ai_anthropic_allowed_models');
		table.json('ai_google_allowed_models');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('ai_google_api_key');
		table.dropColumn('ai_openai_compatible_api_key');
		table.dropColumn('ai_openai_compatible_base_url');
		table.dropColumn('ai_openai_compatible_name');
		table.dropColumn('ai_openai_compatible_models');
		table.dropColumn('ai_openai_compatible_headers');
		table.dropColumn('ai_openai_allowed_models');
		table.dropColumn('ai_anthropic_allowed_models');
		table.dropColumn('ai_google_allowed_models');
	});
}
