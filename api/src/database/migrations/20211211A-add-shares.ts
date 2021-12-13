import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_shares', (table) => {
		table.uuid('id').primary();
		table.string('collection').references('collection').inTable('directus_collections').onDelete('CASCADE');
		table.string('item');
		table.uuid('role').references('id').inTable('directus_roles').onDelete('CASCADE');
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.timestamp('date_expired');
		table.integer('times_used').defaultTo(0);
		table.integer('max_uses');
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropColumn('data');
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.uuid('user').nullable().alter();
		table.uuid('share').references('id').inTable('directus_shares').onDelete('CASCADE');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropColumn('share');
	});

	await knex.schema.dropTable('directus_shares');

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.uuid('user').notNullable().alter();
		table.json('data');
	});
}
