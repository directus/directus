import type { DirectusFile } from '../../../schema/file.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateFileOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFile<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple files at the same time.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the file objects for the updated files.
 */
export const updateFiles =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		keys: DirectusFile<Schema>['id'][],
		item: Partial<DirectusFile<Schema>>,
		query?: TQuery
	): RestCommand<UpdateFileOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/files`,
		params: query ?? {},
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing file, and/or replace it's file contents.
 * @param key
 * @param item
 * @param query
 * @returns Returns the file object for the updated file.
 */
export const updateFile =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFile<Schema>>>(
		key: DirectusFile<Schema>['id'],
		item: Partial<DirectusFile<Schema>>,
		query?: TQuery
	): RestCommand<UpdateFileOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/files/${key}`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
