import type { ApplyQueryFields, CollectionType, Query, UnpackList } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfCoreCollection, throwIfEmpty } from '../../utils/index.js';

export type UpdateItemOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>,
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * Update multiple items at the same time.
 *
 * @param collection The collection of the items
 * @param keysOrQuery The primary keys or a query
 * @param item The item data to update
 * @param query Optional return data query
 *
 * @returns Returns the item objects for the updated items.
 * @throws Will throw if keysOrQuery is empty
 * @throws Will throw if collection is empty
 * @throws Will throw if collection is a core collection
 */
export const updateItems =
	<Schema extends object, Collection extends keyof Schema, const TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		keysOrQuery: string[] | number[] | Query<Schema, Schema[Collection]>,
		item: Partial<UnpackList<Schema[Collection]>>,
		query?: TQuery,
	): RestCommand<UpdateItemOutput<Schema, Collection, TQuery>[], Schema> =>
	() => {
		let payload: Record<string, any> = {};
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use updateItems for core collections');

		if (Array.isArray(keysOrQuery)) {
			throwIfEmpty(keysOrQuery, 'keysOrQuery cannot be empty');
			payload = { keys: keysOrQuery };
		} else {
			throwIfEmpty(Object.keys(keysOrQuery), 'keysOrQuery cannot be empty');
			payload = { query: keysOrQuery };
		}

		payload['data'] = item;

		return {
			path: `/items/${collection as string}`,
			params: query ?? {},
			body: JSON.stringify(payload),
			method: 'PATCH',
		};
	};

/**
 * Update an existing item.
 *
 * @param collection The collection of the item
 * @param key The primary key of the item
 * @param item The item data to update
 * @param query Optional return data query
 *
 * @returns Returns the item object of the item that was updated.
 * @throws Will throw if key is empty
 * @throws Will throw if collection is empty
 * @throws Will throw if collection is a core collection
 */
export const updateItem =
	<
		Schema extends object,
		Collection extends keyof Schema,
		const TQuery extends Query<Schema, Schema[Collection]>,
		Item = UnpackList<Schema[Collection]>,
	>(
		collection: Collection,
		key: string | number,
		item: Partial<Item>,
		query?: TQuery,
	): RestCommand<UpdateItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use updateItem for core collections');

		return {
			path: `/items/${collection as string}/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
