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
	sync(collections: string[], options?: { versioningChanged?: boolean }): void;
	/**
	 * Remove the version tables of a live collection, as well as the references to it from the version tables of other
	 * collections.
	 */
	beforeDrop(collection: string): Promise<void>;
};

const activeChanges = new WeakMap<Knex, SchemaChange>();

/**
 * Run a live schema change in a transaction with foreign keys disabled, then sync the version tables of all
 * collections passed to `change.sync` before committing. Nested calls reuse the outer transaction and sync.
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
				sync: (collections, options) => {
					for (const collection of collections) pending.add(collection);
					if (options?.versioningChanged) shouldSync = true;
				},
				beforeDrop: async (collection) => {
					dropped.add(collection);
					if (!shouldSync) return;
					await service.syncCollections([collection], { exclude: [collection] });
				},
			};

			activeChanges.set(trx, change);

			let result: T;

			try {
				result = await handler(trx, change);
			} finally {
				activeChanges.delete(trx);
			}

			if (pending.size > 0 && shouldSync) {
				await service.syncCollections([...pending], { exclude: [...dropped] });
			}

			return result;
		}),
	);
}
