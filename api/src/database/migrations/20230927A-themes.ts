import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	/**
	 * Knex doesn't support setting defaults to null (you'll end up with `NULL::character varying`),
	 * so we'll have to create a new column, copy over the relevant bits, and remove the old
	 */
	await knex.schema.alterTable('directus_users', (table) => {
		table.string('appearance');
	});

	await knex('directus_users').update({ appearance: 'dark' }).where({ theme: 'dark' });
	await knex('directus_users').update({ appearance: 'light' }).where({ theme: 'light' });

	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('theme');
		table.string('theme_dark');
		table.string('theme_light');
		table.json('theme_light_overrides');
		table.json('theme_dark_overrides');
	});

	await knex('directus_settings').update({ project_color: '#6644ff' }).whereNull('project_color');

	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_color').defaultTo('#6644FF').notNullable().alter();
		table.uuid('public_favicon').references('directus_files.id');

		table.string('default_appearance').defaultTo('auto').notNullable();
		table.string('default_theme_light');
		table.json('theme_light_overrides');
		table.string('default_theme_dark');
		table.json('theme_dark_overrides');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.renameColumn('appearance', 'theme');
	});

	await knex.schema.alterTable('directus_users', (table) => {
		table.string('theme').defaultTo('auto').alter();
		table.dropColumn('theme_dark');
		table.dropColumn('theme_light');
		table.dropColumn('theme_light_overrides');
		table.dropColumn('theme_dark_overrides');
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_color').defaultTo(null).nullable().alter();

		table.dropColumn('public_favicon');
		table.dropColumn('default_appearance');
		table.dropColumn('default_theme_light');
		table.dropColumn('theme_light_overrides');
		table.dropColumn('default_theme_dark');
		table.dropColumn('theme_dark_overrides');
	});
}
