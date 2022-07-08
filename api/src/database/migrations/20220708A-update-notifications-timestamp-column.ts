import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_notifications', (table) => {
		table.timestamp('timestamp').defaultTo(knex.fn.now()).alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_notifications', (table) => {
		table.timestamp('timestamp').notNullable().alter();
	});
}
