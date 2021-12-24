import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';

async function oracleAlterCollections(knex: Knex, type: string): Promise<void> {
	await knex.raw('ALTER TABLE "directus_webhooks" ADD "collections__temp" ?', [knex.raw(type)]);
	await knex.raw('UPDATE "directus_webhooks" SET "collections__temp"="collections"');
	await knex.raw('ALTER TABLE "directus_webhooks" DROP COLUMN "collections"');
	await knex.raw('ALTER TABLE "directus_webhooks" RENAME COLUMN "collections__temp" TO "collections"');
	await knex.raw('ALTER TABLE "directus_webhooks" MODIFY "collections" NOT NULL');
}

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		await oracleAlterCollections(knex, 'CLOB');
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('collections').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Oracledb) {
		await oracleAlterCollections(knex, 'VARCHAR2(255)');
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.string('collections').notNullable().alter();
	});
}
