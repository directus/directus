import type { DirectusFolder } from '../../../schema/folder.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateFolderOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFolder<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing folders.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the folder objects of the folders that were updated.
 * @throws Will throw if keys is empty
 */
export const updateFolders =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFolder<Schema>>>(
		keys: DirectusFolder<Schema>['id'][],
		item: Partial<DirectusFolder<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateFolderOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/folders`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing folder.
 * @param key
 * @param item
 * @param query
 * @returns Returns the folder object of the folder that was updated.
 * @throws Will throw if key is empty
 */
export const updateFolder =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFolder<Schema>>>(
		key: DirectusFolder<Schema>['id'],
		item: Partial<DirectusFolder<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateFolderOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/folders/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
