import type { Knex } from 'knex';
import { useLogger } from '../../logger/index.js';

/**
 * When the retention schedule deletes old `directus_revisions` rows, newer revisions that
 * reference those deleted rows via the `parent` column cause a FK violation because
 * `directus_revisions_parent_foreign` has no ON DELETE action (defaults to RESTRICT/NO ACTION).
 *
 * This migration changes the `parent` FK constraint to ON DELETE SET NULL so that when an old
 * revision is removed, child revisions simply lose their parent reference rather than blocking
 * the deletion.
 *
 * @see https://github.com/directus/directus/issues/26747
 */
export async function up(knex: Knex): Promise<void> {
	const logger = useLogger();

	try {
		await knex.schema.alterTable('directus_revisions', (table) => {
			table.dropForeign(['parent'], 'directus_revisions_parent_foreign');
		});
	} catch (err: any) {
		logger.warn("Couldn't drop directus_revisions.parent foreign key – it may not exist");
		logger.warn(err);
	}

	try {
		await knex.schema.alterTable('directus_revisions', (table) => {
			table
				.foreign('parent', 'directus_revisions_parent_foreign')
				.references('id')
				.inTable('directus_revisions')
				.onDelete('SET NULL');
		});
	} catch (err: any) {
		logger.warn("Couldn't recreate directus_revisions.parent foreign key with ON DELETE SET NULL");
		logger.warn(err);
	}
}

export async function down(knex: Knex): Promise<void> {
	const logger = useLogger();

	try {
		await knex.schema.alterTable('directus_revisions', (table) => {
			table.dropForeign(['parent'], 'directus_revisions_parent_foreign');
		});
	} catch (err: any) {
		logger.warn("Couldn't drop directus_revisions.parent foreign key during rollback");
		logger.warn(err);
	}

	try {
		await knex.schema.alterTable('directus_revisions', (table) => {
			table.foreign('parent', 'directus_revisions_parent_foreign').references('id').inTable('directus_revisions');
		});
	} catch (err: any) {
		logger.warn("Couldn't restore directus_revisions.parent foreign key during rollback");
		logger.warn(err);
	}
}
