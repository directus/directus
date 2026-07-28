import type { ApplyQueryFields, CollectionType, NestedPartial, Query, UnpackList } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfCoreCollection, throwIfEmpty } from '../../utils/index.js';

export type CreateItemOutput<
	Schema,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>,
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * Create new items in the given collection.
 *
 * @param collection The collection of the item
 * @param items The items to create
 * @param query Optional return data query
 *
 * @returns Returns the item objects of the item that were created.
 * @throws Will throw if collection is a core collection
 * @throws Will throw if collection is empty
 */
export const createItems =
	<Schema, Collection extends keyof Schema, const TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		items: NestedPartial<UnpackList<Schema[Collection]>>[],
		query?: TQuery,
	): RestCommand<CreateItemOutput<Schema, Collection, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use createItems for core collections');

		return {
			path: `/items/${collection as string}`,
			params: query ?? {},
			body: JSON.stringify(items),
			method: 'POST',
		};
	};

/**
 * Create a new item in the given collection.
 *
 * @param collection The collection of the item
 * @param item The item to create
 * @param query Optional return data query
 *
 * @returns Returns the item objects of the item that were created.
 * @throws Will throw if collection is a core collection
 * @throws Will throw if collection is empty
 */
export const createItem =
	<Schema, Collection extends keyof Schema, const TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		item: NestedPartial<UnpackList<Schema[Collection]>>,
		query?: TQuery,
	): RestCommand<CreateItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use createItem for core collections');

		return {
			path: `/items/${collection as string}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'POST',
		};
	};
