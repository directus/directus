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
