import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.renameColumn('uploaded_on', 'created_on');
	});

	await knex.schema.alterTable('directus_files', (table) => {
		table.timestamp('uploaded_on');
	});

	await knex.raw('UPDATE directus_files SET uploaded_on = created_on');
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropColumn('uploaded_on');
	});

	await knex.schema.alterTable('directus_files', (table) => {
		table.renameColumn('created_on', 'uploaded_on');
	});
}
