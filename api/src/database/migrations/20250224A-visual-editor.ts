import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('visual_editor_project_url').notNullable().defaultTo(false);
		table.json('visual_editor_urls').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumns('visual_editor_project_url', 'visual_editor_urls');
	});
}
