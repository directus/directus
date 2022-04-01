import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToText('directus_webhooks', 'collections', {
		nullable: false,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToText('directus_webhooks', 'collections');
}
