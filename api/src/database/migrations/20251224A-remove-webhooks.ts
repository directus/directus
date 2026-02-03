import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_webhooks');
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_webhooks', (table) => {
		table.increments('id');
		table.string('name', 255).notNullable();
		table.string('method', 10).notNullable().defaultTo('POST');
		table.text('url').notNullable();
		table.string('status', 10).notNullable().defaultTo('active');
		table.boolean('data').notNullable().defaultTo(true);
		table.string('actions', 100).notNullable();
		table.text('collections').notNullable();
		table.json('headers');
		table.boolean('was_active_before_deprecation').notNullable().defaultTo(false);
		table.uuid('migrated_flow');
		table.foreign('migrated_flow').references('directus_flows.id').onDelete('SET NULL');
	});
}
