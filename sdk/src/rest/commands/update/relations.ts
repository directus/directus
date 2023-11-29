import type { DirectusRelation } from '../../../schema/relation.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateRelationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusRelation<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update an existing relation.
 * @param collection
 * @param field
 * @param item
 * @param query
 * @returns Returns the relation object for the created relation.
 */
export const updateRelation =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRelation<Schema>>>(
		collection: DirectusRelation<Schema>['collection'],
		field: DirectusRelation<Schema>['field'],
		item: NestedPartial<DirectusRelation<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateRelationOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');
		throwIfEmpty(field, 'Field cannot be empty');

		return {
			path: `/relations/${collection}/${field}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
