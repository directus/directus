import type { Query } from '../../../types/index.js';
import { throwIfCoreCollection, throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing items.
 *
 * @param collection The collection of the items
 * @param keysOrQuery The primary keys or a query
 *
 * @returns Nothing
 * @throws Will throw if collection is empty
 * @throws Will throw if collection is a core collection
 * @throws Will throw if keysOrQuery is empty
 */
export const deleteItems =
	<Schema extends object, Collection extends keyof Schema, const TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		keysOrQuery: string[] | number[] | TQuery,
	): RestCommand<void, Schema> =>
	() => {
		let payload: Record<string, any> = {};

		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use deleteItems for core collections');

		if (Array.isArray(keysOrQuery)) {
			throwIfEmpty(keysOrQuery, 'keysOrQuery cannot be empty');
			payload = { keys: keysOrQuery };
		} else {
			throwIfEmpty(Object.keys(keysOrQuery), 'keysOrQuery cannot be empty');
			payload = { query: keysOrQuery };
		}

		return {
			path: `/items/${collection as string}`,
			body: JSON.stringify(payload),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing item.
 *
 * @param collection The collection of the item
 * @param key The primary key of the item
 *
 * @returns Nothing
 * @throws Will throw if collection is empty
 * @throws Will throw if collection is a core collection
 * @throws Will throw if key is empty
 */
export const deleteItem =
	<Schema extends object, Collection extends keyof Schema>(
		collection: Collection,
		key: string | number,
	): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use deleteItem for core collections');
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/items/${collection as string}/${key}`,
			method: 'DELETE',
		};
	};
