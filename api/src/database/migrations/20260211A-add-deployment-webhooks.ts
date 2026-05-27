import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const deploymentsHas = {
		webhook_ids: await knex.schema.hasColumn('directus_deployments', 'webhook_ids'),
		webhook_secret: await knex.schema.hasColumn('directus_deployments', 'webhook_secret'),
		last_synced_at: await knex.schema.hasColumn('directus_deployments', 'last_synced_at'),
	};

	if (Object.values(deploymentsHas).some((exists) => !exists)) {
		await knex.schema.alterTable('directus_deployments', (table) => {
			if (!deploymentsHas.webhook_ids) table.json('webhook_ids').nullable();
			if (!deploymentsHas.webhook_secret) table.string('webhook_secret').nullable();
			if (!deploymentsHas.last_synced_at) table.timestamp('last_synced_at').nullable();
		});
	}

	const projectsHas = {
		url: await knex.schema.hasColumn('directus_deployment_projects', 'url'),
		framework: await knex.schema.hasColumn('directus_deployment_projects', 'framework'),
		deployable: await knex.schema.hasColumn('directus_deployment_projects', 'deployable'),
	};

	if (Object.values(projectsHas).some((exists) => !exists)) {
		await knex.schema.alterTable('directus_deployment_projects', (table) => {
			if (!projectsHas.url) table.string('url').nullable();
			if (!projectsHas.framework) table.string('framework').nullable();
			if (!projectsHas.deployable) table.boolean('deployable').notNullable().defaultTo(true);
		});
	}

	const runsHas = {
		status: await knex.schema.hasColumn('directus_deployment_runs', 'status'),
		url: await knex.schema.hasColumn('directus_deployment_runs', 'url'),
		started_at: await knex.schema.hasColumn('directus_deployment_runs', 'started_at'),
		completed_at: await knex.schema.hasColumn('directus_deployment_runs', 'completed_at'),
	};

	if (Object.values(runsHas).some((exists) => !exists)) {
		await knex.schema.alterTable('directus_deployment_runs', (table) => {
			if (!runsHas.status) table.string('status').nullable();
			if (!runsHas.url) table.string('url').nullable();
			if (!runsHas.started_at) table.timestamp('started_at').nullable();
			if (!runsHas.completed_at) table.timestamp('completed_at').nullable();
		});
	}

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
