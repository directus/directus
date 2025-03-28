import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';
import { getDatabaseClient } from '../index.js';
import { parseDynamicValues } from '../helpers/parse-dynamic-client-values.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const client = getDatabaseClient(knex);

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumns('many_primary', 'one_primary');
		table.string('one_deselect_action').defaultTo('nullify');
	});

	await knex('directus_relations').update({ one_deselect_action: 'nullify' });

	await helper.changeToType('directus_relations', 'sort_field', 'string', {
		length: Number(parseDynamicValues(client, 'MAX_COLUMN_NAME_LENGTH')),
	});

	await helper.changeToType('directus_relations', 'one_deselect_action', 'string', {
		nullable: false,
		default: 'nullify',
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const client = getDatabaseClient(knex);
	const field_length = Number(parseDynamicValues(client, 'MAX_COLUMN_NAME_LENGTH'));

	await helper.changeToType('directus_relations', 'sort_field', 'string', {
		length: 255,
	});

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumn('one_deselect_action');
		table.string('many_primary', field_length);
		table.string('one_primary', field_length);
	});
}
