import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_extensions', (table) => {
		table.string('name').primary().notNullable();
		table.boolean('enabled').notNullable().defaultTo(false);
		table.json('options');
	});

	await knex.schema.createTable('directus_extension_permissions', (table) => {
		table.increments('id').primary().notNullable();
		table.string('extension').notNullable().references('name').inTable('directus_extensions').onDelete('CASCADE');
		table.string('permission').notNullable();
		table.boolean('enabled').notNullable().defaultTo(false);
		table.json('options');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_extension_permissions');
	await knex.schema.dropTable('directus_extensions');
}
