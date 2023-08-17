import type { DirectusFolder } from '../../../schema/folder.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing folders.
 * @param keys
 * @returns
 */
export const deleteFolders =
	<Schema extends object>(keys: DirectusFolder<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/folders`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete multiple existing folders.
 * @param key
 * @returns
 */
export const deleteFolder =
	<Schema extends object>(key: DirectusFolder<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/folders/${key}`,
		method: 'DELETE',
	});
