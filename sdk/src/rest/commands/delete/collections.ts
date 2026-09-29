import type { DirectusCollection } from '../../../schema/collection.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete a collection.
 * @param collection
 * @returns
 * @throws Will throw if collection is empty
 */
export const deleteCollection =
	<Schema>(collection: DirectusCollection<Schema>['collection']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');

		return {
			path: `/collections/${collection}`,
			method: 'DELETE',
		};
	};
