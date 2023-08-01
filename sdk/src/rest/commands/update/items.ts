import type { ApplyQueryFields, CollectionType, Query, UnpackList } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateItemOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * Update multiple items at the same time.
 *
 * @param collection The collection of the items
 * @param keys The primary key of the items
 * @param item The item data to update
 * @param query Optional return data query
 *
 * @returns Returns the item objects for the updated items.
 */
export const updateItems =
	<Schema extends object, Collection extends keyof Schema, const TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		keys: string[] | number[],
		item: Partial<UnpackList<Schema[Collection]>>,
		query?: TQuery
	): RestCommand<UpdateItemOutput<Schema, Collection, TQuery>[], Schema> =>
	() => {
		const _collection = String(collection);

		return {
			path: `/items/${_collection}`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
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
 */
export const updateItem =
	<
		Schema extends object,
		Collection extends keyof Schema,
		const TQuery extends Query<Schema, Schema[Collection]>,
		Item = UnpackList<Schema[Collection]>
	>(
		collection: Collection,
		key: string | number,
		item: Partial<Item>,
		query?: TQuery
	): RestCommand<UpdateItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use updateItem for core collections');
		}

		return {
			path: `/items/${_collection}/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
