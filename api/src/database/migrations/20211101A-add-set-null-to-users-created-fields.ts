import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.foreign('user').references('directus_users.id').onDelete('SET NULL');
	});

	await knex.schema.alterTable('directus_files', (table) => {
		table.dropForeign('uploaded_by');
		table.dropForeign('modified_by');
	});

	return await knex.schema.alterTable('directus_files', (table) => {
		table.foreign('uploaded_by').references('directus_users.id').onDelete('SET NULL');
		table.foreign('modified_by').references('directus_users.id').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.dropForeign('user');
	});

	await knex.schema.alterTable('directus_files', (table) => {
		table.dropForeign('uploaded_by');
		table.dropForeign('modified_by');
	});

	return await knex.schema.alterTable('directus_files', (table) => {
		table.foreign('uploaded_by').references('directus_users.id');
		table.foreign('modified_by').references('directus_users.id');
	});
}
