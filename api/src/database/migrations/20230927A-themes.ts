import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.renameColumn('theme', 'appearance');
		table.string('theme_dark').notNullable().defaultTo('default');
		table.string('theme_light').notNullable().defaultTo('default');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.renameColumn('appearance', 'theme');
		table.dropColumn('theme_dark');
		table.dropColumn('theme_light');
	});
}
