import { getHelpers } from '../helpers/index.js';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_panels', 'icon', 'string', {
		nullable: true,
		default: null,
		length: 30,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_panels', 'icon', 'string', {
		nullable: true,
		default: 'insert_chart',
		length: 30,
	});
}
