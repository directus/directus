import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		await helper.changeToText('directus_webhooks', 'collections', {
			nullable: false,
		});
		return;
	}

	await helper.changeToText('directus_webhooks', 'collections');
	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('collections').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await getHelpers(knex).schema.changeToString('directus_webhooks', 'collections', {
		nullable: false,
		length: 255,
	});
}
