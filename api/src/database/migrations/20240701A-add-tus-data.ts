import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.string('tus_id', 64).nullable();
		table.json('tus_data').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropColumn('tus_id');
		table.dropColumn('tus_data');
	});
}
