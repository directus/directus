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

/**
 * Run a change to the live schema, keeping the version tables in sync with it.
 *
 * The change runs within a transaction (or the current one when `knex` already is a transaction), with foreign key
 * enforcement disabled for vendors that rebuild tables to alter them. The version tables of all collections passed to
 * `change.sync` are synced within the same transaction, after the handler is done.
 *
 * Nested calls reuse the outer transaction. As the foreign key enforcement can't be toggled within a transaction, the
 * outermost call has to be a `runSchemaChange` as well.
 */
export async function runSchemaChange<T>(
	options: { knex: Knex; schema: SchemaOverview },
	handler: (trx: Knex.Transaction, change: SchemaChange) => Promise<T>,
): Promise<T> {
	const { knex, schema } = options;

	return getHelpers(knex).schema.withForeignKeysDisabled(() =>
		transaction(knex, async (trx) => {
			const service = new VersionTablesService({ knex: trx, schema });
			const pending: { collections: string[]; options?: SyncCollectionsOptions | undefined }[] = [];

			const change: SchemaChange = {
				sync: (collections, options) => {
					pending.push({ collections, options });
				},
				beforeDrop: (collection) =>
					service.syncCollections([collection], { includeRelating: true, exclude: [collection] }),
			};

			const result = await handler(trx, change);

			for (const { collections, options } of pending) {
				await service.syncCollections(collections, options);
			}

			return result;
		}),
	);
}
