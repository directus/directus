import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropForeign(['parent'], 'directus_revisions_parent_foreign');

		table
			.foreign('parent', 'directus_revisions_parent_foreign')
			.references('id')
			.inTable('directus_revisions')
			.onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropForeign(['parent'], 'directus_revisions_parent_foreign');

		table.foreign('parent', 'directus_revisions_parent_foreign').references('id').inTable('directus_revisions');
	});
}
