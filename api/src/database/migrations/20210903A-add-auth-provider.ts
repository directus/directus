import { Knex } from 'knex';
// @ts-ignore
import Client_Cockroachdb from 'knex/lib/dialects/cockroachdb';

async function cockroachAlterEmail(knex: Knex, type: string): Promise<void> {
	await knex.raw('ALTER TABLE "directus_users" ADD "email__temp" ?', [knex.raw(type)]);
	await knex.raw('UPDATE "directus_users" SET "email__temp"="email"');
	await knex.raw('ALTER TABLE "directus_users" DROP COLUMN "email"');
	await knex.raw('ALTER TABLE "directus_users" RENAME COLUMN "email__temp" TO "email"');
}

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropUnique(['email']);
	});

	await knex.schema.alterTable('directus_users', (table) => {
		table.string('provider', 128).notNullable().defaultTo('default');
		table.string('external_identifier').unique();
		if (!(knex.client instanceof Client_Cockroachdb)) {
			table.string('email', 128).nullable().alter();
		}
	});

	if (knex.client instanceof Client_Cockroachdb) {
		await cockroachAlterEmail(knex, 'VARCHAR(128)');
	}

	await knex.schema.alterTable('directus_users', (table) => {
		table.unique(['email']);
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.json('data');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('provider');
		table.dropColumn('external_identifier');

		table.string('email', 128).notNullable().alter();
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropColumn('data');
	});
}
