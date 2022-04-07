import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToString('directus_panels', 'icon', {
		nullable: true,
		default: null,
		length: 30,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToString('directus_panels', 'icon', {
		nullable: true,
		default: 'insert_chart',
		length: 30,
	});
}
