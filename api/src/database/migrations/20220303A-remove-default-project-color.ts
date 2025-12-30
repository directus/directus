import { getHelpers } from '../helpers/index.js';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_settings', 'project_color', 'string', {
		nullable: true,
		default: null,
		length: 50,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_settings', 'project_color', 'string', {
		nullable: true,
		default: '#00C897',
		length: 10,
	});
}
