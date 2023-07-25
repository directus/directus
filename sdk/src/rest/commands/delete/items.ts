import type { PrimaryKey } from '@directus/types';
import type { Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing items.
 *
 * @param collection The collection of the items
 * @param keysOrQuery The primary keys or a query
 *
 * @returns Nothing
 */
export const deleteItems =
	<Schema extends object, Collection extends keyof Schema, const TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		keysOrQuery: PrimaryKey[] | TQuery
	): RestCommand<void, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}`,
			body: JSON.stringify(Array.isArray(keysOrQuery) ? { keys: keysOrQuery } : { query: keysOrQuery }),
			method: 'DELETE',
			onResponse: null,
		};
	};
/**
 * Delete an existing item.
 *
 * @param collection The collection of the item
 * @param key The primary key of the item
 *
 * @returns Nothing
 */
export const deleteItem =
	<Schema extends object, Collection extends keyof Schema>(
		collection: Collection,
		key: PrimaryKey
	): RestCommand<void, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}/${key}`,
			method: 'DELETE',
			onResponse: null,
		};
	};
