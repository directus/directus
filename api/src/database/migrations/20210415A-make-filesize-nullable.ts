import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('filesize').nullable().defaultTo(null).alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('filesize').notNullable().defaultTo(0).alter();
	});
}
