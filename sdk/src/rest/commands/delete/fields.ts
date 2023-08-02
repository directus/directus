import type { DirectusField } from '../../../schema/field.js';
import type { RestCommand } from '../../types.js';

/**
 * Deletes the given field in the given collection.
 * @param collection
 * @param field
 * @returns
 */
export const deleteField =
	<Schema extends object>(
		collection: DirectusField<Schema>['collection'],
		field: DirectusField<Schema>['field']
	): RestCommand<void, Schema> =>
	() => ({
		path: `/fields/${collection}/${field}`,
		method: 'DELETE',
	});
