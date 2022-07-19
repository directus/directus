import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToType('directus_webhooks', 'collections', 'text', {
		nullable: false,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToType('directus_webhooks', 'collections', 'text');
}
