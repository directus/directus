import type { PrimaryKey } from '@directus/types';
import type { ApplyQueryFields, CollectionType, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type UpdateItemOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * Update an existing item.
 *
 * @param collection The collection of the item
 * @param key The primary key of the item
 * @param item The item data to update
 * @param query Optional return data query
 *
 * @returns Returns the item object of the item that was updated.
 */
export const updateItem =
	<
		Schema extends object,
		Collection extends keyof Schema,
		TQuery extends Query<Schema, Schema[Collection]>,
		Item = Schema[Collection]
	>(
		collection: Collection,
		key: PrimaryKey,
		item: Partial<Item>,
		query?: TQuery
	): RestCommand<UpdateItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}/${key}`,
			params: queryToParams(query ?? {}),
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
