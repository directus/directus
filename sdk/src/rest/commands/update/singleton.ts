import type { ApplyQueryFields, CollectionType, Query, SingletonCollections } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateSingletonOutput<
	Schema extends object,
	Collection extends SingletonCollections<Schema>,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * Update a singleton item
 *
 * @param collection The collection of the items
 * @param query The query parameters
 *
 * @returns An array of up to limit item objects. If no items are available, data will be an empty array.
 */
export const updateSingleton =
	<
		Schema extends object,
		Collection extends SingletonCollections<Schema>,
		const TQuery extends Query<Schema, Schema[Collection]>,
		Item = Schema[Collection]
	>(
		collection: Collection,
		item: Partial<Item>,
		query?: TQuery
	): RestCommand<UpdateSingletonOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use updateSingleton for core collections');
		}

		return {
			path: `/items/${_collection}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
