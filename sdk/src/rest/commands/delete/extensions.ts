import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete an existing extension.
 *
 * @param id The UUID of the extension to delete
 *
 * @returns Nothing
 * @throws Will throw if id is empty
 */
export const deleteExtension =
	<Schema>(id: string): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(id, 'ID cannot be empty');

		return {
			path: `/extensions/${id}`,
			method: 'DELETE',
		};
	};
