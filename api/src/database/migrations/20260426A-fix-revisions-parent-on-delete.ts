import type { Knex } from 'knex';

/**
 * Fix the directus_revisions.parent self-referencing FK to use ON DELETE SET NULL.
 *
 * Previously the constraint had no ON DELETE action (defaulting to RESTRICT). When the
 * retention job deletes activity rows, CASCADE removes the associated revisions. If any
 * of those revisions are referenced as `parent` by newer revisions (outside the retention
 * window), the RESTRICT constraint blocks the delete and the entire batch fails.
 *
 * With ON DELETE SET NULL, deleting a parent revision simply nullifies the `parent`
 * column in child revisions, allowing retention to succeed without FK violations.
 *
 * Related: https://github.com/directus/directus/issues/26747
 */
export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropForeign(['parent']);
		table.foreign('parent').references('directus_revisions.id').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropForeign(['parent']);
		table.foreign('parent').references('directus_revisions.id');
	});
}
