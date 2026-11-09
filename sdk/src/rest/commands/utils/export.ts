import type { Query } from '../../../index.js';
import type { DirectusFile } from '../../../schema/file.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type FileFormat = 'csv' | 'csv_utf8' | 'json' | 'xml' | 'yaml';

/**
 * Export a larger data set to a file in the File Library
 * @returns Nothing
 * @throws Will throw if collection is empty
 */
export const utilsExport =
	<Schema, TQuery extends Query<Schema, Schema[Collection]>, Collection extends keyof Schema>(
		collection: Collection,
		format: FileFormat,
		query: TQuery,
		file: Partial<DirectusFile<Schema>>,
	): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(collection as string, 'Collection cannot be empty');

		return {
			method: 'POST',
			path: `/utils/export/${collection as string}`,
			body: JSON.stringify({ format, query, file }),
		};
	};
