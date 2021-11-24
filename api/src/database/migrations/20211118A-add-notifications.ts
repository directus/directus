import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_notifications', (table) => {
		table.increments();
		table.timestamp('timestamp').notNullable();
		table.string('status').defaultTo('inbox');
		table.uuid('recipient').notNullable();
		table.uuid('sender');
		table.string('subject').notNullable();
		table.text('message');
		table.string('collection', 64);
		table.string('item');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_notifications');
}
