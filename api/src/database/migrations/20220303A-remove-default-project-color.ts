import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToString('directus_settings', 'project_color', {
		nullable: true,
		default: null,
		length: 50,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToString('directus_settings', 'project_color', {
		nullable: true,
		default: '#00C897',
		length: 10,
	});
}
