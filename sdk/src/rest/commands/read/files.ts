import type { DirectusFile } from '../../../schema/file.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadFileOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFile<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all files that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit file objects. If no items are available, data will be an empty array.
 */
export const readFiles =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadFileOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/files`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * Retrieve a single file by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a file object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readFile =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		key: DirectusFile<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadFileOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/files/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
