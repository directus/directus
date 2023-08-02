import type { ApplyQueryFields, CollectionType, Query, RegularCollections } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type ReadItemOutput<
	Schema extends object,
	Collection extends RegularCollections<Schema>,
	TQuery extends Query<Schema, CollectionType<Schema, Collection>>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * List all items that exist in Directus.
 *
 * @param collection The collection of the items
 * @param query The query parameters
 *
 * @returns An array of up to limit item objects. If no items are available, data will be an empty array.
 */
export const readItems =
	<
		Schema extends object,
		Collection extends RegularCollections<Schema>,
		const TQuery extends Query<Schema, CollectionType<Schema, Collection>>
	>(
		collection: Collection,
		query?: TQuery
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>[], Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}`,
			params: query ?? {},
			method: 'GET',
		};
	};

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
	<
		Schema extends object,
		Collection extends RegularCollections<Schema>,
		const TQuery extends Query<Schema, CollectionType<Schema, Collection>>
	>(
		collection: Collection,
		key: string | number,
		query?: TQuery
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItem for core collections');
		}

		return {
			path: `/items/${_collection}/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
