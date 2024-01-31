import type { Query } from '../../../index.js';
import type { DirectusFile } from '../../../schema/file.js';
import type { RestCommand } from '../../types.js';

export type FileFormat = 'csv' | 'json' | 'xml' | 'yaml';

/**
 * Export a larger data set to a file in the File Library
 * @returns Nothing
 */
export const utilsExport =
	<Schema extends object, TQuery extends Query<Schema, Schema[Collection]>, Collection extends keyof Schema>(
		collection: Collection,
		format: FileFormat,
		query: TQuery,
		file: Partial<DirectusFile<Schema>>,
	): RestCommand<void, Schema> =>
	() => ({
		method: 'POST',
		path: `/utils/export/${collection as string}`,
		body: JSON.stringify({ format, query, file }),
	});
