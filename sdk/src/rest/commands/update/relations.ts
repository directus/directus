import type { DirectusRelation } from '../../../schema/relation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type UpdateRelationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusRelation<Schema>
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
	<Schema extends object, TQuery extends Query<Schema, DirectusRelation<Schema>>>(
		collection: DirectusRelation<Schema>['collection'],
		field: DirectusRelation<Schema>['field'],
		item: Partial<DirectusRelation<Schema>>,
		query?: TQuery
	): RestCommand<UpdateRelationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/relations/${collection}/${field}`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'PATCH',
	});
