import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		return;
	}

	await knex.schema.alterTable('directus_files', (table) => {
		table.bigInteger('filesize').nullable().defaultTo(null).alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		return;
	}

	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('filesize').nullable().defaultTo(null).alter();
	});
}
