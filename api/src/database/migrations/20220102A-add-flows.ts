import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_flows', (table) => {
		table.uuid('id').primary();
		table.string('name').notNullable();
		table.string('icon', 30).notNullable().defaultTo('arrow-decision');
		table.text('note');
		table.string('status').notNullable().defaultTo('inactive');
		table.string('trigger');
		table.json('options');
		table.uuid('operation').unique().references('id').inTable('directus_operations').onDelete('SET NULL');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	await knex.schema.createTable('directus_operations', (table) => {
		table.uuid('id').primary();
		table.string('type').notNullable();
		table.string('key').notNullable();
		table.json('options');
		table.uuid('resolve').unique().references('id').inTable('directus_operations').onDelete('SET NULL');
		table.uuid('reject').unique().references('id').inTable('directus_operations').onDelete('SET NULL');
		table.uuid('flow').notNullable().references('id').inTable('directus_flows').onDelete('CASCADE');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_operations');
	await knex.schema.dropTable('directus_flows');
}
