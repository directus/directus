import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../../database/helpers/index.js';
import { transaction } from '../../utils/transaction.js';
import { type SyncCollectionsOptions, VersionTablesService } from '../version-tables.js';

export type SchemaChange = {
	/**
	 * Sync the version tables of the given collections once the change is done, right before the transaction is
	 * committed. Has to be called for every collection whose live table, versioning setting or relations are changed.
	 */
	sync(collections: string[], options?: Pick<SyncCollectionsOptions, 'includeRelating'>): void;
	/**
	 * Remove the version tables of a live collection, as well as the references to it from the version tables of other
	 * collections. Has to be awaited before the live table is dropped, as the version tables reference it.
	 */
	beforeDrop(collection: string): Promise<void>;
};

/** The change of the outermost `runSchemaChange` call, by its transaction, for nested calls to reuse */
const activeChanges = new WeakMap<Knex, SchemaChange>();

/**
 * Run a change to the live schema, keeping the version tables in sync with it.
 *
 * The change runs within a transaction (or the current one when `knex` already is a transaction), with foreign key
 * enforcement disabled for vendors that rebuild tables to alter them. The version tables of all collections passed to
 * `change.sync` are synced within the same transaction, after the handler is done.
 *
 * Nested calls reuse the outer transaction and defer their syncs to the outermost call, so every collection is only
 * synced once. As the foreign key enforcement can't be toggled within a transaction, the outermost call has to be a
 * `runSchemaChange` as well.
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
			const pendingRelating = new Set<string>();
			const dropped = new Set<string>();

			const change: SchemaChange = {
				sync: (collections, options) => {
					for (const collection of collections) {
						(options?.includeRelating ? pendingRelating : pending).add(collection);
					}
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

			// Dropped collections no longer have a live table to sync from
			const exclude = dropped.size > 0 ? { exclude: [...dropped] } : {};

			const collections = [...pending].filter(
				(collection) => !pendingRelating.has(collection) && !dropped.has(collection),
			);

			const relatingCollections = [...pendingRelating].filter((collection) => !dropped.has(collection));

			if (collections.length > 0) await service.syncCollections(collections, exclude);
			if (relatingCollections.length > 0)
				await service.syncCollections(relatingCollections, { includeRelating: true, ...exclude });

			return result;
		}),
	);
}
