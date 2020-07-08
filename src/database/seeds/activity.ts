import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<any> {
	await knex.schema.dropTableIfExists('directus_activity');

	await knex.schema.createTable('directus_activity', (table) => {
		table.increments().notNullable();
		table.string('action', 45).notNullable();
		table.uuid('action_by').nullable();
		// table.foreign('action_by').references('directus_users.id');
		table.timestamp('action_on').defaultTo(knex.fn.now()).notNullable();
		table.string('ip', 50).notNullable();
		table.string('user_agent').notNullable();
		table.string('collection', 64).notNullable();
		// table.foreign('collection').references('directus_collections.collection');
		table.string('item').notNullable();
		table.text('comment').nullable();
	});
}
