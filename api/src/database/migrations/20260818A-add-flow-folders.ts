import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../utils/get-default-index-name.js';

const indexName = getDefaultIndexName('foreign', 'directus_flows', 'folder');

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_folders', (table) => {
		table.string('type').notNullable().defaultTo('assets');
	});

	// Backfill every existing folder as a file-library (asset) folder.
	await knex('directus_folders').update({ type: 'assets' });

	await knex.schema.alterTable('directus_flows', (table) => {
		table.uuid('folder').references('id').inTable('directus_folders').withKeyName(indexName).onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_flows', (table) => {
		table.dropForeign(['folder'], indexName);
		table.dropColumn('folder');
	});

	await knex.schema.alterTable('directus_folders', (table) => {
		table.dropColumn('type');
	});
}
