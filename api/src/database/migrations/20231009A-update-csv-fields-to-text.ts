import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const csvFields = await knex.select('collection', 'field').from('directus_fields').where('special', '=', 'cast-csv');
	for (const entry of csvFields) {
		const { defaultValue, nullable } = await knex(entry.collection).columnInfo(entry.field);
		await helper.changeToType(entry.collection, entry.field, 'text', {
			default: defaultValue,
			nullable,
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const csvFields = await knex.select('collection', 'field').from('directus_fields').where('special', '=', 'cast-csv');
	for (const entry of csvFields) {
		const { defaultValue, nullable } = await knex(entry.collection).columnInfo(entry.field);
		await helper.changeToType(entry.collection, entry.field, 'string', {
			default: defaultValue,
			nullable,
		});
	}
}
