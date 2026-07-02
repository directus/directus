import type { RestCommand } from '../../types.js';

export interface RelationalImportInput {
	collection: string;
	items: Record<string, any>[];
}

export interface RelationalImportOptions {
	/** `add` inserts new items (remapping conflicting keys), `merge` upserts. Defaults to `add`. */
	mode?: 'add' | 'merge';
	/** When true, no data is persisted; the computed id mappings are still returned. */
	dry_run?: boolean;
}

export interface RelationalImportResult {
	mode: 'add' | 'merge';
	dry_run: boolean;
	order: string[];
	deferred: { collection: string; field: string }[];
	mappings: Record<string, Record<string, string | number>>;
}

/**
 * Import data for multiple related collections in a single request. The relations are resolved from
 * the schema so collections are imported in the correct order and primary keys are remapped.
 *
 * @param data The collections and their items to import.
 * @param options Import mode and dry-run flag.
 * @returns The import order, deferred fields, and old -> new primary key mappings per collection.
 */
export const utilsImportRelational =
	<Schema>(
		data: RelationalImportInput[],
		options: RelationalImportOptions = {},
	): RestCommand<RelationalImportResult, Schema> =>
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
