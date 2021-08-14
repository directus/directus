import { Knex } from 'knex';
import { getDefaultIndexName } from '../../utils/get-default-index-name';

const indexName = getDefaultIndexName('foreign', 'directus_settings', 'maintenance_role');

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('maintenance_enabled');
		table
			.uuid('maintenance_role')
			.references('id')
			.inTable('directus_roles')
			.withKeyName(indexName)
			.onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropForeign(['maintenance_role'], indexName);
		table.dropColumn('maintenance_role');
		table.dropColumn('maintenance_enabled');
	});
}
