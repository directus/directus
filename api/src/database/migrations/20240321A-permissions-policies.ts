import type { Knex } from 'knex';
import type { Role } from '@directus/types';

// NOTE: knex.schema.renameTable isn't reliable cross vendor, so can't be used here
export async function up(knex: Knex): Promise<void> {
	// Create policies table that's identical to roles
	await knex.schema.createTable('directus_policies', (table) => {
		table.uuid('id').primary();
		table.string('name', 100).notNullable();
		table.string('icon', 30).notNullable();
		table.text('description');
		table.text('ip_access');
		table.boolean('enforce_tfa');
		table.boolean('admin_access');
		table.boolean('app_access');
	});

	// Copy existing roles 1-1 to policies
	const roles = await knex.select('*').from('directus_roles');
	await knex('directus_policies').insert(roles);

	// Drop access control fields from roles
	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropColumn('ip_access');
		table.dropColumn('enforce_tfa');
		table.dropColumn('admin_access');
		table.dropColumn('app_access');
	});
}

export async function down(_knex: Knex): Promise<void> {}
