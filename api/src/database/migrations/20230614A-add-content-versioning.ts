import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_branches', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name').notNullable();
		table.string('collection', 64).references('collection').inTable('directus_collections').onDelete('CASCADE');
		table.string('item');
		table.string('icon', 30);
		table.string('color').nullable();
		table.string('hash').notNullable();
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	await knex.schema.alterTable('directus_collections', (table) => {
		table.boolean('branches_enabled').notNullable().defaultTo(false);
	});

	await knex.schema.alterTable('directus_revisions', (table) => {
		table.uuid('branch').references('id').inTable('directus_branches').onDelete('CASCADE');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_branches');

	await knex.schema.alterTable('directus_collections', (table) => {
		table.dropColumn('branches_enabled');
	});

	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropColumn('branch');
	});
}
