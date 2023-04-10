import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		// Oracle and Cockroach are already not nullable due to an oversight in
		// "20201105B-change-webhook-url-type.ts"
		return;
	}

	await helper.changeToType('directus_webhooks', 'url', 'string', {
		nullable: false,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		// Oracle and Cockroach are already not nullable due to an oversight in
		// "20201105B-change-webhook-url-type.ts"
		return;
	}

	await helper.changeToType('directus_webhooks', 'url', 'string');
}
