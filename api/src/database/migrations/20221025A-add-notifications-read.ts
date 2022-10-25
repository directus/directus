import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_notifications', (table) => {
		table.boolean('read').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_notifications', (table) => {
		table.dropColumn('read');
	});
}
