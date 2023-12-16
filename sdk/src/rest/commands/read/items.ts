import type { ApplyQueryFields, CollectionType, Query, QueryItem, RegularCollections } from '../../../types/index.js';
import { throwIfEmpty, throwIfCoreCollection } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadItemOutput<
	Schema extends object,
	Collection extends RegularCollections<Schema>,
	TQuery extends Query<Schema, CollectionType<Schema, Collection>>,
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * List all items that exist in Directus.
 *
 * @param collection The collection of the items
 * @param query The query parameters
 *
 * @returns An array of up to limit item objects. If no items are available, data will be an empty array.
 * @throws Will throw if collection is a core collection
 * @throws Will throw if collection is empty
 */
export const readItems =
	<
		Schema extends object,
		Collection extends RegularCollections<Schema>,
		const TQuery extends Query<Schema, CollectionType<Schema, Collection>>,
	>(
		collection: Collection,
		query?: TQuery,
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use readItems for core collections');

		return {
			path: `/items/${collection as string}`,
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
 * @throws Will throw if collection is a core collection
 * @throws Will throw if collection is empty
 * @throws Will throw if key is empty
 */
export const readItem =
	<
		Schema extends object,
		Collection extends RegularCollections<Schema>,
		const TQuery extends QueryItem<Schema, CollectionType<Schema, Collection>>,
	>(
		collection: Collection,
		key: string | number,
		query?: TQuery,
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use readItem for core collections');
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/items/${collection as string}/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
