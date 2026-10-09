import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../utils/get-default-index-name.js';

const indexName = getDefaultIndexName('foreign', 'directus_settings', 'default_exports_folder');

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table
			.uuid('default_exports_folder')
			.references('id')
			.inTable('directus_folders')
			.withKeyName(indexName)
			.onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropForeign(['default_exports_folder'], indexName);
		table.dropColumn('default_exports_folder');
	});
}
