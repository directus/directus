import type { RestCommand } from '../../types.js';

/**
 * Import multiple records from a JSON or CSV file into a collection.
 * @returns Nothing
 */
export const utilsImport =
	<Schema>(collection: keyof Schema, data: FormData): RestCommand<void, Schema> =>
	() => ({
		path: `/utils/import/${collection as string}`,
		method: 'POST',
		body: data,
		headers: { 'Content-Type': 'multipart/form-data' },
	});

export interface ImportBatchOptions {
	mode?: 'add' | 'merge';
	dryRun?: boolean;
	dangerouslyAllowDelete?: boolean;
}

export interface ImportBatchCollectionResult {
	existing: (string | number)[];
	new: (string | number)[];
	deleted: (string | number)[];
	mapped: Record<string, string | number>;
}

export interface ImportBatchResult {
	applied: boolean; // `false` for a dry run.
	mode: 'add' | 'merge';
	collections: Record<string, ImportBatchCollectionResult>;
}

/**
 * Import flat data for multiple related collections in a single request. The payload is uploaded as a
 * JSON file (`multipart/form-data`); build the `FormData` with a single file field containing an array
 * of `{ collection, items }` objects.
 *
 * @param data A FormData object holding the JSON file to import.
 * @param options Import mode, dry-run, and destructive-delete flags.
 * @returns Per-collection summary of the changes: existing, new, deleted, and remapped primary keys.
 */
export const utilsImportBatch =
	<Schema>(data: FormData, options: ImportBatchOptions = {}): RestCommand<ImportBatchResult, Schema> =>
	() => ({
		path: '/utils/import',
		method: 'POST',
		params: options,
		body: data,
		headers: { 'Content-Type': 'multipart/form-data' },
	});
