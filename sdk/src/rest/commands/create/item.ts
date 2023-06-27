import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateItemOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, Schema[Collection], TQuery['fields']>;

/**
 * Create a new item in the given collection.
 *
 * @param collection The collection of the item
 * @param item The item to create
 * @param query Optional return data query
 *
 * @returns Returns the item objects of the item that were created.
 */
export const createItem =
	<
		Schema extends object,
		Collection extends keyof Schema,
		TQuery extends Query<Schema, Schema[Collection]>,
		Item = Schema[Collection]
	>(
		collection: Collection,
		item: Partial<Item>,
		query?: TQuery
	): RestCommand<CreateItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}`,
			params: queryToParams(query ?? {}),
			body: JSON.stringify(item),
			method: 'POST',
		};
	};
