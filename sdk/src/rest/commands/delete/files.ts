import type { DirectusFile } from '../../../schema/file.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple files at once.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteFiles =
	<Schema extends object>(keys: DirectusFile<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		if (keys.length === 0) {
			throw new Error('Keys cannot be empty');
		}

		return {
			path: `/files`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing file.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteFile =
	<Schema extends object>(key: DirectusFile<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		if (key.length === 0) {
			throw new Error('Key cannot be empty');
		}

		return {
			path: `/files/${key}`,
			method: 'DELETE',
		};
	};
