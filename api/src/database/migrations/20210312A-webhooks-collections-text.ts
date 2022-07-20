import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	await helper.changeToType('directus_webhooks', 'collections', 'text');
}

export async function down(knex: Knex): Promise<void> {
	await getHelpers(knex).schema.changeToType('directus_webhooks', 'collections', 'string', {
		nullable: false,
		length: 255,
	});
}
