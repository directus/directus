import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_dashboards', (table) => {
		table.uuid('id').primary();
		table.string('name');
		table.string('icon', 30);
		table.timestamp('date_created');
		table.timestamp('user_created');
	});

	await knex.schema.createTable('directus_panels', (table) => {
		table.uuid('id').primary();
		table.string('name');
		table.string('icon', 30);
		table.string('color', 10);
		table.text('note');
		table.string('type');
		table.integer('position_x');
		table.integer('position_y');
		table.integer('width');
		table.integer('height');
		table.json('options');
		table.timestamp('date_created');
		table.timestamp('user_created');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_dashboards');
	await knex.schema.dropTable('directus_panels');
}
