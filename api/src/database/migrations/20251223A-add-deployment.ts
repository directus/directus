import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_deployment', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('provider').notNullable().unique();
		table.text('credentials');
		table.text('options');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	await knex.schema.createTable('directus_deployment_projects', (table) => {
		table.uuid('id').primary().notNullable();
		table.uuid('deployment').notNullable().references('id').inTable('directus_deployment').onDelete('CASCADE');
		table.string('external_id').notNullable();
		table.string('name').notNullable();
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.unique(['deployment', 'external_id']);
	});

	await knex.schema.createTable('directus_deployment_runs', (table) => {
		table.uuid('id').primary().notNullable();
		table.uuid('project').notNullable().references('id').inTable('directus_deployment_projects').onDelete('CASCADE');
		table.string('external_id').notNullable();
		table.string('target').notNullable(); // 'production' or 'preview'
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_deployment_runs');
	await knex.schema.dropTable('directus_deployment_projects');
	await knex.schema.dropTable('directus_deployment');
}

