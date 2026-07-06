import type { RestCommand } from '../../types.js';

export interface ImportBatchInput {
	collection: string;
	items: Record<string, any>[];
}

export interface ImportBatchOptions {
	/** `add` inserts new items (remapping conflicting keys), `merge` upserts. Defaults to `add`. */
	mode?: 'add' | 'merge';
	/** When true, no data is persisted; the computed id mappings are still returned. */
	dry_run?: boolean;
}

export interface ImportBatchCollectionResult {
	/** Primary keys of pre-existing records that were matched and updated. */
	existing: (string | number)[];
	/** Primary keys of newly created records. */
	new: (string | number)[];
	/** Provided primary key -> new primary key, for records whose key was remapped. */
	mapped: Record<string, string | number>;
}

export interface ImportBatchResult {
	/** Whether the changes were committed. `false` for a dry run. */
	applied: boolean;
	mode: 'add' | 'merge';
	collections: Record<string, ImportBatchCollectionResult>;
}

/**
 * Import data for multiple related collections in a single request. The relations are resolved from
 * the schema so collections are imported in the correct order and primary keys are remapped.
 *
 * @param data The collections and their items to import.
 * @param options Import mode and dry-run flag.
 * @returns The import order, deferred fields, and old -> new primary key mappings per collection.
 */
export const utilsImportBatch =
	<Schema>(data: ImportBatchInput[], options: ImportBatchOptions = {}): RestCommand<ImportBatchResult, Schema> =>
	() => {
		const params: Record<string, string> = {};

		if (options.mode) params['mode'] = options.mode;
		if (options.dry_run !== undefined) params['dry_run'] = String(options.dry_run);

		return {
			path: '/utils/import',
			method: 'POST',
			params,
			body: JSON.stringify(data),
		};
	};
