import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		// Oracle is already not nullable due to an oversight in
		// "20210312A-webhooks-collections-text.ts"
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('collections').notNullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		// Oracle is already not nullable due to an oversight in
		// "20210312A-webhooks-collections-text.ts"
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('collections').alter();
	});
}
