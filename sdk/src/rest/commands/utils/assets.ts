import type { RestCommand } from '../../types.js';

/**
 * Purge generated asset transformations from storage. Admin only.
 * @param files Optional list of file IDs to scope the purge. Clears all files if omitted.
 * @returns Nothing
 */
export const clearAssetTransformations =
	<Schema>(files?: string[]): RestCommand<void, Schema> =>
	() => ({
		method: 'DELETE',
		path: `/assets/transformations`,
		body: JSON.stringify(files ? { files } : {}),
	});
