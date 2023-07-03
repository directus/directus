import type { PrimaryKey } from '@directus/types';
import type { ApplyQueryFields, CollectionType, Query, RegularCollections } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadItemOutput<
	Schema extends object,
	Collection extends RegularCollections<Schema>,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * Get an item that exists in Directus.
 *
 * @param collection The collection of the item
 * @param key The primary key of the item
 * @param query The query parameters
 *
 * @returns Returns an item object if a valid primary key was provided.
 */
export const readItem =
	<Schema extends object, Collection extends RegularCollections<Schema>, TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		key: PrimaryKey,
		query?: TQuery
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItem for core collections');
		}

		return {
			path: `/items/${_collection}/${key}`,
			params: queryToParams(query ?? {}),
			method: 'GET',
		};
	};
