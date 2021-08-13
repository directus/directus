import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('maintenance_active');
		table
			.uuid('maintenance_role')
			.references('id')
			.inTable('directus_roles')
			.withKeyName('maintenance_role')
			.onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropForeign(['maintenance_role']);
		table.dropColumn('maintenance_role');
		table.dropColumn('maintenance_active');
	});
}
