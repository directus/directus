import type { DirectusVersion } from '../../../schema/version.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type UpdateContentVersionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusVersion<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing Content Versions.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the Content Version objects for the updated Content Versions.
 * @throws Will throw if keys is empty
 */
export const updateContentVersions =
	<Schema extends object, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		keys: DirectusVersion<Schema>['id'][],
		item: Partial<DirectusVersion<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateContentVersionOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/versions`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing Content Version.
 * @param key
 * @param item
 * @param query
 * @returns Returns the Content Version object for the updated Content Version.
 * @throws Will throw if key is empty
 */
export const updateContentVersion =
	<Schema extends object, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		key: DirectusVersion<Schema>['id'],
		item: Partial<DirectusVersion<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateContentVersionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/versions/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
