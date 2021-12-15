import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';
// @ts-ignore
import Client_Cockroachdb from 'knex/lib/dialects/cockroachdb';

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb || knex.client instanceof Client_Cockroachdb) {
		// Oracle and Cockroach are already not nullable due to an oversight in
		// "20201105B-change-webhook-url-type.ts"
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('url').notNullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb || knex.client instanceof Client_Cockroachdb) {
		// Oracle and Cockroach are already not nullable due to an oversight in
		// "20201105B-change-webhook-url-type.ts"
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('url').alter();
	});
}
