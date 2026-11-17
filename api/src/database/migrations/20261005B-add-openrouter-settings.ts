import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.text('ai_openrouter_api_key');
		table.json('ai_openrouter_models');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('ai_openrouter_api_key');
		table.dropColumn('ai_openrouter_models');
	});
}
