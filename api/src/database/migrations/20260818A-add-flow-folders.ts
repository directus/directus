import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_folders', (table) => {
		table.string('type').notNullable().defaultTo('files');
	});

	await knex.schema.alterTable('directus_flows', (table) => {
		table.uuid('folder').references('id').inTable('directus_folders').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_flows', (table) => {
		table.dropForeign(['folder']);
		table.dropColumn('folder');
	});

	await knex.schema.alterTable('directus_folders', (table) => {
		table.dropColumn('type');
	});
}
