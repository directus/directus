import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToText('directus_webhooks', 'collections');
}

export async function down(knex: Knex): Promise<void> {
	await getHelpers(knex).schema.changeToString('directus_webhooks', 'collections', {
		nullable: false,
		length: 255,
	});
}
