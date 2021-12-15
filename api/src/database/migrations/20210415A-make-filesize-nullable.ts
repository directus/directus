import { Knex } from 'knex';
// @ts-ignore
import Client_Cockroachdb from 'knex/lib/dialects/cockroachdb';

async function cockroachAlterFilesize(knex: Knex, type: string): Promise<void> {
	await knex.raw('ALTER TABLE "directus_files" ADD "filesize__temp" ? DEFAULT NULL', [knex.raw(type)]);
	await knex.raw('UPDATE "directus_files" SET "filesize__temp"="filesize"');
	await knex.raw('ALTER TABLE "directus_files" DROP COLUMN "filesize"');
	await knex.raw('ALTER TABLE "directus_files" RENAME COLUMN "filesize__temp" TO "filesize"');
}

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Cockroachdb) {
		await cockroachAlterFilesize(knex, 'INTEGER');
		return;
	}

	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('filesize').nullable().defaultTo(null).alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('filesize').notNullable().defaultTo(0).alter();
	});
}
