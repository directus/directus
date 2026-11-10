import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../../database/helpers/index.js';
import { transaction } from '../../utils/transaction.js';
import { VersionTablesService } from '../version-tables.js';

export type SchemaChange = {
	/**
	 * Sync the version tables of the given collections once all changes are done.
	 */
	sync(collections: string[]): void;
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

			const change: SchemaChange = {
				sync: (collections) => {
					for (const collection of collections) pending.add(collection);
				},
				beforeDrop: async (collection) => {
					dropped.add(collection);
					await service.syncCollections([collection], { includeRelating: true, exclude: [collection] });
				},
			};

			activeChanges.set(trx, change);

			let result: T;

			try {
				result = await handler(trx, change);
			} finally {
				activeChanges.delete(trx);
			}

			if (pending.size > 0) {
				await service.syncCollections([...pending], { includeRelating: true, exclude: [...dropped] });
			}

			return result;
		}),
	);
}
