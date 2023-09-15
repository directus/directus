import type { DirectusFile } from '../../../schema/file.js';
import { throwIfEmpty } from '../../utils/index.js';
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
		throwIfEmpty(keys, 'Keys cannot be empty');

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
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/files/${key}`,
			method: 'DELETE',
		};
	};
