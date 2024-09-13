import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {

	await knex.schema.alterTable('directus_files', (table) => {
		table.timestamp('created_on');
	});

	await knex('directus_files').update('created_on', knex.ref('uploaded_on'));
}

export async function down(knex: Knex): Promise<void> {

	await knex.schema.alterTable('directus_files', (table) => {
		table.dropColumn('created_on');
	});
}
