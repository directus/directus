import type { DirectusOperation } from '../../../schema/operation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateOperationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusOperation<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new operations.
 * @param items 
 * @param query 
 * @returns Returns the operation object for the created operation.
 */
export const createOperations =
	<Schema extends object, TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		items: Partial<DirectusOperation<Schema>>[],
		query?: TQuery
	): RestCommand<CreateOperationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/operations`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new operation.
 * @param item 
 * @param query 
 * @returns Returns the operation object for the created operation.
 */
export const createOperation =
	<Schema extends object, TQuery extends Query<Schema, DirectusOperation<Schema>>>(
		item: Partial<DirectusOperation<Schema>>,
		query?: TQuery
	): RestCommand<CreateOperationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/operations`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
