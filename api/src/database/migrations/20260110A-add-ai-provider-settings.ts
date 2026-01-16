import type { Knex } from 'knex';

const DEFAULT_OPENAI_MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'];
const DEFAULT_ANTHROPIC_MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-5'];
const DEFAULT_GOOGLE_MODELS = ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'];

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

	// Set default allowed models for existing installations
	await knex('directus_settings').update({
		ai_openai_allowed_models: JSON.stringify(DEFAULT_OPENAI_MODELS),
		ai_anthropic_allowed_models: JSON.stringify(DEFAULT_ANTHROPIC_MODELS),
		ai_google_allowed_models: JSON.stringify(DEFAULT_GOOGLE_MODELS),
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
