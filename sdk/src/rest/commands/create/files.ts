import type { DirectusFile } from '../../../schema/file.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateFileOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFile<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Upload/create a new file.
 *
 * @param data Formdata object
 * @param query The query parameters
 *
 * @returns Returns the file object for the uploaded file, or an array of file objects if multiple files were uploaded at once.
 */
export const uploadFiles =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		data: FormData,
		query?: TQuery,
	): RestCommand<CreateFileOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: '/files',
		method: 'POST',
		body: data,
		params: query ?? {},
		headers: { 'Content-Type': 'multipart/form-data' },
	});

/**
 * Import a file from the web
 *
 * @param url The url to import the file from
 * @param data Formdata object
 * @param query The query parameters
 *
 * @returns Returns the file object for the imported file.
 */
export const importFile =
	<Schema extends object, TQuery extends Query<Schema, DirectusFile<Schema>>>(
		url: string,
		data: Partial<DirectusFile<Schema>> = {},
		query?: TQuery,
	): RestCommand<CreateFileOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: '/files/import',
		method: 'POST',
		body: JSON.stringify({ url, data }),
		params: query ?? {},
	});
