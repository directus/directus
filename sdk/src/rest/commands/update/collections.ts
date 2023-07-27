import type { DirectusCollection } from '../../../schema/collection.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateCollectionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusCollection<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update the metadata for an existing collection.
 * @param collection
 * @param item
 * @param query
 * @returns The collection object for the updated collection in this request.
 */
export const updateCollection =
	<Schema extends object, const TQuery extends Query<Schema, DirectusCollection<Schema>>>(
		collection: DirectusCollection<Schema>['collection'],
		item: NestedPartial<DirectusCollection<Schema>>,
		query?: TQuery
	): RestCommand<UpdateCollectionOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/collections/${collection}`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
