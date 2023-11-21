import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_analytics', (table) => {
		table.timestamp('timestamp').primary().notNullable().defaultTo(knex.fn.now());
		table.integer('requests').unsigned();
		table.bigInteger('bandwidth_read').unsigned();
		table.bigInteger('bandwidth_write').unsigned();
		table.integer('app_users').unsigned();
		table.integer('api_users').unsigned();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_analytics');
}
