import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';
import { createInspector } from '@directus/schema';

export async function up(knex: Knex) {
	const inspector = createInspector(knex);
	const helper = getHelpers(knex).schema;
	const csvFields = await knex.select('collection', 'field').from('directus_fields').where('special', '=', 'cast-csv');

	const updates: Promise<void>[] = [];

	for (const { collection, field } of csvFields) {
		updates.push(
			inspector.columnInfo(collection, field).then((column) => {
				return helper.changeToType(collection, field, 'text', {
					default: column.default_value,
					nullable: column.is_nullable,
				});
			})
		);
	}

	return Promise.all(updates);
}

export async function down(knex: Knex) {
	const inspector = createInspector(knex);
	const helper = getHelpers(knex).schema;
	const csvFields = await knex.select('collection', 'field').from('directus_fields').where('special', '=', 'cast-csv');

	const updates: Promise<void>[] = [];

	for (const { collection, field } of csvFields) {
		updates.push(
			inspector.columnInfo(collection, field).then((column) => {
				return helper.changeToType(collection, field, 'string', {
					default: column.default_value,
					nullable: column.is_nullable,
				});
			})
		);
	}

	return Promise.all(updates);
}
