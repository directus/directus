import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';
// @ts-ignore
import Client_Cockroachdb from 'knex/lib/dialects/cockroachdb';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).migration;

	if (knex.client instanceof Client_Oracledb || knex.client instanceof Client_Cockroachdb) {
		await helper.changeToText('directus_webhooks', 'url', {
			nullable: false,
		});
		return;
	}

	await helper.changeToText('directus_webhooks', 'url');
}

export async function down(knex: Knex): Promise<void> {
	await getHelpers(knex).migration.changeToString('directus_webhooks', 'url', {
		nullable: false,
		length: 255,
	});
}
