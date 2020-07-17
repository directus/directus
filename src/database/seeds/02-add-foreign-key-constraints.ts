import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<any> {
	await knex.schema.table('directus_activity', (table) => {
		table.foreign('collection').references('collection').inTable('directus_collections');
		table.foreign('action_by').references('id').inTable('directus_users');
	});

	await knex.schema.table('directus_fields', (table) => {
		table.foreign('collection').references('collection').inTable('directus_collections');
	});

	await knex.schema.table('directus_files', (table) => {
		table.foreign('folder').references('id').inTable('directus_folders');
	});

	await knex.schema.table('directus_folders', (table) => {
		table.foreign('parent_folder').references('id').inTable('directus_folders');
	});

	await knex.schema.table('directus_permissions', (table) => {
		table.foreign('role').references('id').inTable('directus_roles');
		table.foreign('collection').references('collection').inTable('directus_collections');
	});

	await knex.schema.table('directus_presets', (table) => {
		table.foreign('user').references('id').inTable('directus_users');
		table.foreign('collection').references('collection').inTable('directus_collections');
	});

	await knex.schema.table('directus_relations', (table) => {
		table.foreign('collection_many').references('collection').inTable('directus_collections');
		table.foreign('collection_one').references('collection').inTable('directus_collections');
	});

	await knex.schema.table('directus_revisions', (table) => {
		table.foreign('collection').references('collection').inTable('directus_collections');
	});

	await knex.schema.table('directus_sessions', (table) => {
		table.foreign('user').references('id').inTable('directus_users');
	});

	await knex.schema.table('directus_settings', (table) => {
		table.foreign('project_foreground').references('id').inTable('directus_files');
		table.foreign('project_background').references('id').inTable('directus_files');
	});
}
