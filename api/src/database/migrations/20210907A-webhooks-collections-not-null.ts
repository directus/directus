import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		// Oracle and Cockroach are already not nullable due to an oversight in
		// "20210312A-webhooks-collections-text.ts"
		return;
	}

	await helper.changeToText('directus_webhooks', 'collections', {
		nullable: false,
	});

	await helper.changeToText('directus_webhooks', 'collections', {
		nullable: false,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		// Oracle are already not nullable due to an oversight in
		// "20210312A-webhooks-collections-text.ts"
		return;
	}

	await helper.changeToText('directus_webhooks', 'collections');
}
