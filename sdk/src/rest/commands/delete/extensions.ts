import type { DirectusExtension } from '../../../schema/extension.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete an existing extension.
 *
 * @param id - UUID of the extension
 * @returns Nothing
 * @throws Will throw if id is empty
 */
export const deleteExtension =
	<Schema>(id: DirectusExtension<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(id, 'Id cannot be empty');

		return {
			path: `/extensions/${id}`,
			method: 'DELETE',
		};
	};
