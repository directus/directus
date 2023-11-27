import type { DirectusOperation } from '../../../schema/operation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateOperationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusOperation<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new operations.
 *
 * @param items The operation to create
 * @param query Optional return data query
 *
 * @returns Returns the operation object for the created operation.
 */
export const createOperations =
	<Schema extends object, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		items: Partial<DirectusOperation<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateOperationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/operations`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new operation.
 *
 * @param item The operation to create
 * @param query Optional return data query
 *
 * @returns Returns the operation object for the created operation.
 */
export const createOperation =
	<Schema extends object, const TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		item: Partial<DirectusOperation<Schema>>,
		query?: TQuery,
	): RestCommand<CreateOperationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/operations`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
