import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_error_url').nullable();
		table.string('project_bug_url').nullable();
		table.string('project_feature_url').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('project_error_url');
		table.dropColumn('project_bug_url');
		table.dropColumn('project_feature_url');
	});
}
