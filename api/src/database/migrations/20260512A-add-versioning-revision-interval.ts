import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.float('versioning_revision_interval').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_collections', (table) => {
		table.dropColumn('versioning_revision_interval');
	});
}
