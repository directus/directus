import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';

async function oracleAlterUrl(knex: Knex, type: string): Promise<void> {
	await knex.raw('ALTER TABLE "directus_webhooks" ADD "url__temp" ?', [knex.raw(type)]);
	await knex.raw('UPDATE "directus_webhooks" SET "url__temp"="url"');
	await knex.raw('ALTER TABLE "directus_webhooks" DROP COLUMN "url"');
	await knex.raw('ALTER TABLE "directus_webhooks" RENAME COLUMN "url__temp" TO "url"');
	await knex.raw('ALTER TABLE "directus_webhooks" MODIFY "url" NOT NULL');
}

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		await oracleAlterUrl(knex, 'CLOB');
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('url').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		await oracleAlterUrl(knex, 'VARCHAR2(255)');
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.string('url').notNullable().alter();
	});
}
