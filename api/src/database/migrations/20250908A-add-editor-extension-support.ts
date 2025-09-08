import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// Add editor field to directus_presets to support custom editor extensions
	// This allows users to configure custom item editors per collection via the preset system
	await knex.schema.alterTable('directus_presets', (table) => {
		table.string('editor').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_presets', (table) => {
		table.dropColumn('editor');
	});
}
