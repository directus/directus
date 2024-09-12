import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.renameColumn('uploaded_on', 'created_on');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.renameColumn('created_on', 'uploaded_on');
	});
}
