import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('collections').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.string('collections').alter();
	});
}
