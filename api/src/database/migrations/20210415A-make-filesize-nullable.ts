import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToInteger('directus_files', 'filesize', {
		nullable: true,
		default: null,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToInteger('directus_files', 'filesize', {
		nullable: false,
		default: 0,
	});
}
