import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const type = helper.isOneOfClients(['oracle', 'cockroachdb']) ? 'text' : 'string';

	await helper.changeToType('directus_webhooks', 'collections', type, {
		nullable: false,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const type = helper.isOneOfClients(['oracle', 'cockroachdb']) ? 'text' : 'string';
	await helper.changeToType('directus_webhooks', 'collections', type);
}
