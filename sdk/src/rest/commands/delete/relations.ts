import type { DirectusRelation } from '../../../schema/relation.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete an existing relation.
 * @param collection
 * @param field
 * @returns
 */
export const deleteRelation =
	<Schema extends object>(
		collection: DirectusRelation<Schema>['collection'],
		field: DirectusRelation<Schema>['field']
	): RestCommand<void, Schema> =>
	() => ({
		path: `/relations/${collection}/${field}`,
		method: 'DELETE',
	});
