import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const type = helper.isOneOfClients(['oracle', 'cockroachdb']) ? 'text' : 'string';
	await helper.changeToType('directus_webhooks', 'url', type);
}

export async function down(knex: Knex): Promise<void> {
	await getHelpers(knex).schema.changeToType('directus_webhooks', 'url', 'string', {
		nullable: false,
		length: 255,
	});
}
