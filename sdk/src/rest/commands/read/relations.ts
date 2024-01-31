import type { DirectusRelation } from '../../../schema/relation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadRelationOutput<
	Schema extends object,
	Item extends object = DirectusRelation<Schema>,
> = ApplyQueryFields<Schema, Item, '*'>;

/**
 * List all Relations that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Relation objects. If no items are available, data will be an empty array.
 */
export const readRelations =
	<Schema extends object>(): RestCommand<ReadRelationOutput<Schema>[], Schema> =>
	() => ({
		path: `/relations`,
		method: 'GET',
	});

/**
 * List an existing Relation by primary key.
 * @param collection The collection
 * @returns Returns a Relation object if a valid primary key was provided.
 * @throws Will throw if collection is empty
 */
export const readRelationByCollection =
	<Schema extends object>(
		collection: DirectusRelation<Schema>['collection'],
	): RestCommand<ReadRelationOutput<Schema>, Schema> =>
	() => ({
		path: `/relations/${collection}`,
		method: 'GET',
	});

/**
 * List an existing Relation by primary key.
 * @param collection The collection
 * @param field The field
 * @returns Returns a Relation object if a valid primary key was provided.
 * @throws Will throw if collection is empty
 * @throws Will throw if field is empty
 */
export const readRelation =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRelation<Schema>>>(
		collection: DirectusRelation<Schema>['collection'],
		field: DirectusRelation<Schema>['field'],
	): RestCommand<ReadRelationOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');
		throwIfEmpty(field, 'Field cannot be empty');

		return {
			path: `/relations/${collection}/${field}`,
			method: 'GET',
		};
	};
