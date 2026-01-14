import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

/**
 * Adds a composite index on directus_revisions (collection, item, version)
 * to optimize queries that filter by collection and item.
 *
 * This fixes slow COUNT queries like:
 * SELECT COUNT(*) FROM directus_revisions WHERE collection = $1 AND item = $2 AND version IS NULL
 */
export async function up(knex: Knex): Promise<void> {
	const helpers = getHelpers(knex);

	await helpers.schema.createIndex('directus_revisions', ['collection', 'item', 'version'], {
		attemptConcurrentIndex: true,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helpers = getHelpers(knex);

	const indexName = helpers.schema.generateIndexName('index', 'directus_revisions', ['collection', 'item', 'version']);

	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropIndex(['collection', 'item', 'version'], indexName);
	});
}
