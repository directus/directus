import type { DirectusOperation } from '../../../schema/operation.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateOperationOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusOperation<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing operations.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the operation objects for the updated operations.
 * @throws Will throw if keys is empty
 */
export const updateOperations =
	<Schema, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		keys: DirectusOperation<Schema>['id'][],
		item: Partial<DirectusOperation<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateOperationOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/operations`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update multiple operations as batch.
 * @param items
 * @param query
 * @returns Returns the operation objects for the updated operations.
 */
export const updateOperationsBatch =
	<Schema, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		items: NestedPartial<DirectusOperation<Schema>>[],
		query?: TQuery,
	): RestCommand<UpdateOperationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/operations`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'PATCH',
	});

/**
 * Update an existing operation.
 * @param key
 * @param item
 * @param query
 * @returns Returns the operation object for the updated operation.
 * @throws Will throw if key is empty
 */
export const updateOperation =
	<Schema, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		key: DirectusOperation<Schema>['id'],
		item: Partial<DirectusOperation<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateOperationOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/operations/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
