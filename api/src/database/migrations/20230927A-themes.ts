import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.renameColumn('theme', 'appearance');
		table.string('theme_dark').notNullable().defaultTo('default');
		table.string('theme_light').notNullable().defaultTo('default');
	});

	await knex('directus_settings').update({ project_color: '#6644ff' }).whereNull('project_color');

	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_color').defaultTo('#6644FF').notNullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.renameColumn('appearance', 'theme');
		table.dropColumn('theme_dark');
		table.dropColumn('theme_light');
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_color').defaultTo(null).nullable().alter();
	});
}
