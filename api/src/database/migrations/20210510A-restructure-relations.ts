import { Knex } from 'knex';
// @ts-ignore
import Client_Cockroachdb from 'knex/lib/dialects/cockroachdb';

async function cockroachAlterSortField(knex: Knex, type: string): Promise<void> {
	await knex.raw('ALTER TABLE "directus_relations" ADD "sort_field__temp" ?', [knex.raw(type)]);
	await knex.raw('UPDATE "directus_relations" SET "sort_field__temp"="sort_field"');
	await knex.raw('ALTER TABLE "directus_relations" DROP COLUMN "sort_field"');
	await knex.raw('ALTER TABLE "directus_relations" RENAME COLUMN "sort_field__temp" TO "sort_field"');
}

export async function up(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Cockroachdb) {
		await knex.schema.alterTable('directus_relations', (table) => {
			table.dropColumns('many_primary', 'one_primary');
			table.string('one_deselect_action').notNullable().defaultTo('nullify');
		});

		await cockroachAlterSortField(knex, 'VARCHAR(64)');

		return;
	}

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumns('many_primary', 'one_primary');
		table.string('one_deselect_action').defaultTo('nullify');
		table.string('sort_field', 64).alter();
	});

	await knex('directus_relations').update({ one_deselect_action: 'nullify' });

	await knex.schema.alterTable('directus_relations', (table) => {
		table.string('one_deselect_action').notNullable().defaultTo('nullify').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (knex.client instanceof Client_Cockroachdb) {
		await cockroachAlterSortField(knex, 'VARCHAR(255)');

		await knex.schema.alterTable('directus_relations', (table) => {
			table.dropColumn('one_deselect_action');
			table.string('many_primary', 64);
			table.string('one_primary', 64);
		});

		return;
	}
	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumn('one_deselect_action');
		table.string('many_primary', 64);
		table.string('one_primary', 64);
		table.string('sort_field', 255).alter();
	});
}
