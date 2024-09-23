import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_shares', (table) => {
		table.dropColumn('roles');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_shares', (table) => {
		table.uuid('role').references('id').inTable('directus_roles').onDelete('CASCADE');
	});
}
