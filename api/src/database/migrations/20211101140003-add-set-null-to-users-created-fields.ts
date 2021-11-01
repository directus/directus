import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropForeign('uploaded_by');
	});
	return await knex.schema.alterTable('directus_files', (table) => {
		table.foreign('uploaded_by').references('directus_users.id').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropColumn('uploaded_by');
	});
}
