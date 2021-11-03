import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropForeign('uploaded_by');
		table.dropForeign('modified_by');
	});

	return await knex.schema.alterTable('directus_files', (table) => {
		table.foreign('uploaded_by').references('directus_users.id').onDelete('NO ACTION').onUpdate('NO ACTION');
		table.foreign('modified_by').references('directus_users.id').onDelete('NO ACTION').onUpdate('NO ACTION');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropForeign('uploaded_by');
		table.dropForeign('modified_by');
	});

	return await knex.schema.alterTable('directus_files', (table) => {
		table.foreign('uploaded_by').references('directus_users.id');
		table.foreign('modified_by').references('directus_users.id');
	});
}
