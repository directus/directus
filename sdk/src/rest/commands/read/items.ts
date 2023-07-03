import type { ApplyQueryFields, CollectionType, Query, RegularCollections } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadItemsOutput<
	Schema extends object,
	Collection extends RegularCollections<Schema>,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>[];

/**
 * List all items that exist in Directus.
 *
 * @param collection The collection of the items
 * @param query The query parameters
 *
 * @returns An array of up to limit item objects. If no items are available, data will be an empty array.
 */
export const readItems =
	<Schema extends object, Collection extends RegularCollections<Schema>, TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		query?: TQuery
	): RestCommand<ReadItemsOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}`,
			params: queryToParams(query ?? {}),
			method: 'GET',
		};
	};
