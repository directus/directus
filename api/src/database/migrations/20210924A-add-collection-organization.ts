import type { Knex } from 'knex';
import { getDatabaseClient } from '../index.js';
import { parseDynamicValues } from '../helpers/parse-dynamic-client-values.js';

export async function up(knex: Knex): Promise<void> {
	const client = getDatabaseClient(knex);

	await knex.schema.alterTable('directus_collections', (table) => {
		table.integer('sort');
		table
			.string('group', Number(parseDynamicValues(client, 'MAX_TABLE_NAME_LENGTH')))
			.references('collection')
			.inTable('directus_collections');
		table.string('collapse').defaultTo('open').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.dropColumn('sort');
		table.dropColumn('group');
		table.dropColumn('collapse');
	});
}
