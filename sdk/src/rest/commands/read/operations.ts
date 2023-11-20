import type { DirectusOperation } from '../../../schema/operation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadOperationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusOperation<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all operations that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit operation objects. If no items are available, data will be an empty array.
 */
export const readOperations =
	<Schema extends object, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadOperationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/operations`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List all Operations that exist in Directus.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Operation object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readOperation =
	<Schema extends object, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		key: DirectusOperation<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadOperationOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/operations/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
