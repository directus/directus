import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const hasGlobalSearchConfig = await knex.schema.hasColumn('directus_settings', 'global_search_config');

	if (hasGlobalSearchConfig) return;

	await knex.schema.alterTable('directus_settings', (table) => {
		table.json('global_search_config');
	});
}

export async function down(knex: Knex): Promise<void> {
	const hasGlobalSearchConfig = await knex.schema.hasColumn('directus_settings', 'global_search_config');

	if (!hasGlobalSearchConfig) return;

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('global_search_config');
	});
}
