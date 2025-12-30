import { getHelpers } from '../helpers/index.js';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_files', 'filesize', 'integer', {
		nullable: true,
		default: null,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_files', 'filesize', 'integer', {
		nullable: false,
		default: 0,
	});
}
