import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToText('directus_webhooks', 'url');
}

export async function down(knex: Knex): Promise<void> {
	await getHelpers(knex).schema.changeToString('directus_webhooks', 'url', {
		nullable: false,
		length: 255,
	});
}
