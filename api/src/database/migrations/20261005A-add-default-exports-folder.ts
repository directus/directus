import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../utils/get-default-index-name.js';
import { getDatabaseClient } from '../index.js';

const indexName = getDefaultIndexName('foreign', 'directus_settings', 'default_exports_folder');

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		const foreign = table
			.uuid('default_exports_folder')
			.references('id')
			.inTable('directus_folders')
			.withKeyName(indexName);

		/**
		 * MSSQL doesn't allow multiple cascade paths between the same tables, and
		 * storage_default_folder already uses SET NULL on directus_folders
		 */
		if (getDatabaseClient(knex) !== 'mssql') {
			foreign.onDelete('SET NULL');
		}
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropForeign(['default_exports_folder'], indexName);
		table.dropColumn('default_exports_folder');
	});
}
