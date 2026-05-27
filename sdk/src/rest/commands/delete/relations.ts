import type { DirectusRelation } from '../../../schema/relation.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete an existing relation.
 * @param collection
 * @param field
 * @returns
 * @throws Will throw if collection is empty
 * @throws Will throw if field is empty
 */
export const deleteRelation =
	<Schema>(
		collection: DirectusRelation<Schema>['collection'],
		field: DirectusRelation<Schema>['field'],
	): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');
		throwIfEmpty(field, 'Field cannot be empty');

		return {
			path: `/relations/${collection}/${field}`,
			method: 'DELETE',
		};
	};
