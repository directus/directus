import type { DirectusFile } from '../../../schema/file.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple files at once.
 * @param keys
 * @returns
 */
export const deleteFiles =
	<Schema extends object>(keys: DirectusFile<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/files`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing file.
 * @param key
 * @returns
 */
export const deleteFile =
	<Schema extends object>(key: DirectusFile<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/files/${key}`,
		method: 'DELETE',
	});
