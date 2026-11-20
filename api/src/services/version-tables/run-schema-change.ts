import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../../database/helpers/index.js';
import { transaction } from '../../utils/transaction.js';
import { VersionTablesService } from '../version-tables.js';

export type SchemaChange = {
	/**
	 * Sync the version tables of the given collections once all changes are done.
	 * Set `versioningChanged` when the change toggles versioning, as the sync is skipped otherwise if no collection of
	 * the schema is versioned.
	 */
	sync(collections: string, options?: { force?: boolean }): void;
	/**
	 * Drop the table of a live collection once all changes are done, after its version tables and the references to it
	 * from the version tables of other collections were removed.
	 */
	drop(collection: string): void;
};

const activeChanges = new WeakMap<Knex, SchemaChange>();

/**
 * Run a live schema change in a transaction with foreign keys disabled, then sync the version tables of all
 * collections passed to `change.sync` and drop the tables passed to `change.drop` before committing. Nested calls reuse
 * the outer transaction, sync and drops.
 */
export async function runSchemaChange<T>(
	options: { knex: Knex; schema: SchemaOverview },
	handler: (trx: Knex.Transaction, change: SchemaChange) => Promise<T>,
): Promise<T> {
	const { knex, schema } = options;

	const outerChange = activeChanges.get(knex);

	if (outerChange) return handler(knex as Knex.Transaction, outerChange);

	return getHelpers(knex).schema.withForeignKeysDisabled(() =>
		transaction(knex, async (trx) => {
			const service = new VersionTablesService({ knex: trx, schema });
			const pending = new Set<string>();
			const dropped = new Set<string>();
			let shouldSync = Object.values(schema.collections).some((c) => c.versioned);

			const change: SchemaChange = {
				sync: (collection, options) => {
					pending.add(collection);

					if (options?.force) shouldSync = true;
				},
				drop: dropped.add,
			};

			activeChanges.set(trx, change);

			let result: T;

			try {
				result = await handler(trx, change);
			} finally {
				activeChanges.delete(trx);
			}

			const collections = new Set([...pending, ...dropped]);

			// Version tables reference the live tables, so they have to be removed before the live tables are dropped
			if (collections.size > 0 && shouldSync) {
				await service.syncCollections([...collections], { exclude: [...dropped] });
			}

			for (const collection of dropped) {
				await trx.schema.dropTable(collection);
			}

			return result;
		}),
	);
}
