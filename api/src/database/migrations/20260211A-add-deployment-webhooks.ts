import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_deployments', (table) => {
		table.json('webhook_ids').nullable();
		table.string('webhook_secret').nullable();
		table.timestamp('last_synced_at').nullable();
	});

	await knex.schema.alterTable('directus_deployment_projects', (table) => {
		table.string('url').nullable();
		table.string('framework').nullable();
		table.boolean('deployable').notNullable().defaultTo(true);
	});

	await knex.schema.alterTable('directus_deployment_runs', (table) => {
		table.string('status').nullable();
		table.string('url').nullable();
		table.timestamp('started_at').nullable();
		table.timestamp('completed_at').nullable();
	});

	await knex('directus_deployment_runs').delete();
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_deployment_runs', (table) => {
		table.dropColumn('status');
		table.dropColumn('url');
		table.dropColumn('started_at');
		table.dropColumn('completed_at');
	});

	await knex.schema.alterTable('directus_deployment_projects', (table) => {
		table.dropColumn('url');
		table.dropColumn('framework');
		table.dropColumn('deployable');
	});

	await knex.schema.alterTable('directus_deployments', (table) => {
		table.dropColumn('webhook_ids');
		table.dropColumn('webhook_secret');
		table.dropColumn('last_synced_at');
	});
}
