import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_extensions', (table) => {
		table.string('name').primary().notNullable();
		table.boolean('enabled').notNullable().defaultTo(false);
		table.json('granted_permissions')
		table.json('options');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_extensions');
}
