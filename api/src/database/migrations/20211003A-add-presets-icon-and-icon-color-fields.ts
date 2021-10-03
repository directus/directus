import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_presets', (table) => {
		table.string('icon', 30).defaultTo('bookmark_border');
		table.string('color', 10);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_presets', (table) => {
		table.dropColumn('icon');
		table.dropColumn('color');
	});
}
