import type { DirectusCollection } from '../../../schema/collection.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateCollectionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusCollection<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create a new Collection. This will create a new table in the database as well.
 * @param item This endpoint doesn't currently support any query parameters.
 * @param query 
 * @returns The collection object for the collection created in this request.
 */
export const createCollection =
	<Schema extends object, TQuery extends Query<Schema, DirectusCollection<Schema>>>(
		item: Partial<DirectusCollection<Schema>>,
		query?: TQuery
	): RestCommand<CreateCollectionOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/collections`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
