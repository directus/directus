import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<any> {
	/**
	 * @NOTE
	 * The order here matters because of the foreign key constraints
	 */
	await knex.schema.dropTableIfExists('directus_collections');
	await knex.schema.createTable('directus_collections', (table) => {
		table.string('collection').primary();
		table.boolean('hidden').notNullable().defaultTo(false);
		table.boolean('single').notNullable().defaultTo(false);
		table.string('icon', 30);
		table.string('note', 255);
		table.json('translation');
	});

	await knex.schema.dropTableIfExists('directus_roles');
	await knex.schema.createTable('directus_roles', (table) => {
		table.uuid('id').primary();
		table.string('name', 100).notNullable();
		table.text('description');
		table.text('ip_whitelist');
		table.boolean('enforce_2fa').notNullable().defaultTo(false);
		table.json('module_listing');
		table.json('collection_listing');
		table.boolean('admin').notNullable().defaultTo(false);
		table.boolean('app_access').notNullable().defaultTo(true);
	});

	await knex.schema.dropTableIfExists('directus_users');
	await knex.schema.createTable('directus_users', (table) => {
		table.uuid('id').primary();
		table.string('status', 16).notNullable().defaultTo('draft');
		table.string('first_name', 50);
		table.string('last_name', 50);
		table.string('email', 128).notNullable();
		table.string('password', 255);
		table.string('token', 255);
		table.string('timezone', 32).notNullable().defaultTo('America/New_York');
		table.string('locale', 8);
		table.uuid('avatar');
		table.string('company', 255);
		table.string('title', 255);
		table.timestamp('last_access_on');
		table.string('last_page', 100);
		table.string('2fa_secret', 255);
		table.string('theme', 20);
		table.uuid('role');
		table.foreign('role').references('id').inTable('directus_roles');
	});

	await knex.schema.dropTableIfExists('directus_fields');
	await knex.schema.createTable('directus_fields', (table) => {
		table.increments().notNullable();
		table.string('collection', 64).notNullable();
		table.foreign('collection').references('collection').inTable('directus_collections');
		table.string('field', 64).notNullable();
		table.string('special', 64);
		table.string('interface', 64);
		table.json('options');
		table.string('display', 64);
		table.string('note', 255);
		table.json('display_options');
		table.boolean('locked').notNullable().defaultTo(false);
		table.boolean('required').notNullable().defaultTo(false);
		table.boolean('readonly').notNullable().defaultTo(false);
		table.boolean('hidden').notNullable().defaultTo(false);
		table.integer('sort');
		table.string('width', 30);
		table.integer('group');
		table.json('translation');
	});

	await knex.schema.dropTableIfExists('directus_activity');
	await knex.schema.createTable('directus_activity', (table) => {
		table.increments().notNullable();
		table.string('action', 45).notNullable();
		table.uuid('action_by');
		table.foreign('action_by').references('id').inTable('directus_users');
		table.timestamp('action_on').defaultTo(knex.fn.now()).notNullable();
		table.string('ip', 50).notNullable();
		table.string('user_agent').notNullable();
		table.string('collection', 64).notNullable();
		table.foreign('collection').references('collection').inTable('directus_collections');
		table.string('item').notNullable();
		table.text('comment');
	});

	await knex.schema.dropTableIfExists('directus_folders');
	await knex.schema.createTable('directus_folders', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name', 255).notNullable();
		table.uuid('parent_folder');
		table.foreign('parent_folder').references('id').inTable('directus_folders');
	});

	await knex.schema.dropTableIfExists('directus_files');
	await knex.schema.createTable('directus_files', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('storage', 50).notNullable();
		table.string('filename_disk', 255).notNullable();
		table.string('filename_download', 255).notNullable();
		table.string('title', 255);
		table.string('type', 255);
		table.uuid('uploaded_by');
		table.timestamp('uploaded_on').notNullable().defaultTo(knex.fn.now());
		table.string('charset', 50);
		table.integer('filesize');
		table.integer('width');
		table.integer('height');
		table.integer('duration');
		table.string('embed', 200);
		table.uuid('folder');
		table.foreign('folder').references('id').inTable('directus_folders');
		table.text('description');
		table.text('location');
		table.text('tags');
		table.json('metadata');
	});

	await knex.schema.dropTableIfExists('directus_permissions');
	await knex.schema.createTable('directus_permissions', (table) => {
		table.increments();
		table.uuid('role');
		table.foreign('role').references('id').inTable('directus_roles');
		table.string('collection', 64).notNullable();
		table.foreign('collection').references('collection').inTable('directus_collections');
		table.string('operation', 10).notNullable();
		table.json('permissions').notNullable().defaultTo('{}');
		table.json('presets');
		table.text('fields');
		table.integer('limit');
	});

	await knex.schema.dropTableIfExists('directus_presets');
	await knex.schema.createTable('directus_presets', (table) => {
		table.increments().notNullable();
		table.string('title');
		table.uuid('user');
		table.foreign('user').references('id').inTable('directus_users');
		table.string('collection', 64).notNullable();
		table.foreign('collection').references('collection').inTable('directus_collections');
		table.string('search_query', 100);
		table.json('filters');
		table.string('view_type', 100).notNullable();
		table.json('view_query');
		table.json('view_options');
		table.uuid('role');
	});

	await knex.schema.dropTableIfExists('directus_relations');
	await knex.schema.createTable('directus_relations', (table) => {
		table.increments();
		table.string('collection_many', 64).notNullable();
		table.foreign('collection_many').references('collection').inTable('directus_collections');
		table.string('field_many', 64).notNullable();
		table.string('primary_many', 64);
		table.string('collection_one', 64);
		table.foreign('collection_one').references('collection').inTable('directus_collections');
		table.string('field_one', 64);
		table.string('primary_one', 64);
		table.string('junction_field', 64);
	});

	await knex.schema.dropTableIfExists('directus_revisions');
	await knex.schema.createTable('directus_revisions', (table) => {
		table.increments();
		table.integer('activity').notNullable();
		table.foreign('id').references('id').inTable('directus_activity');
		table.string('collection', 64).notNullable();
		table.foreign('collection').references('collection').inTable('directus_collections');
		table.string('item', 255).notNullable();
		table.json('data');
		table.json('delta');
		table.integer('parent');
	});

	await knex.schema.dropTableIfExists('directus_sessions');
	await knex.schema.createTable('directus_sessions', (table) => {
		table.increments();
		table.uuid('user').notNullable();
		table.foreign('user').references('id').inTable('directus_users');
		table.timestamp('expires').notNullable();
		table.string('ip', 255);
		table.string('user_agent', 255);
	});

	await knex.schema.dropTableIfExists('directus_settings');
	await knex.schema.createTable('directus_settings', (table) => {
		table.increments();
		table.string('project_name', 100);
		table.string('project_url', 255);
		table.string('project_color', 10);
		table.json('asset_shortcuts');
		table.string('asset_generation', 15);
		table.uuid('project_foreground');
		table.foreign('project_foreground').references('id').inTable('directus_files');
		table.uuid('project_background');
		table.foreign('project_background').references('id').inTable('directus_files');

		/**
		 * @todo extend with all settings
		 */
	});

	await knex.schema.dropTableIfExists('directus_webhooks');
	await knex.schema.createTable('directus_webhooks', (table) => {
		/**
		 * @todo
		 * Figure out final webhooks schema
		 */
		table.increments();
	});
}
