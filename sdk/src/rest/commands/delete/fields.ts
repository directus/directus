import type { DirectusField } from '../../../schema/field.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Deletes the given field in the given collection.
 * @param collection
 * @param field
 * @returns
 * @throws Will throw if collection is empty
 * @throws Will throw if field is empty
 */
export const deleteField =
	<Schema extends object>(
		collection: DirectusField<Schema>['collection'],
		field: DirectusField<Schema>['field'],
	): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');
		throwIfEmpty(field, 'Field cannot be empty');

		return {
			path: `/fields/${collection}/${field}`,
			method: 'DELETE',
		};
	};
