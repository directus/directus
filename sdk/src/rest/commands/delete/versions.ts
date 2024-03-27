import type { DirectusVersion } from '../../../schema/version.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing Content Versions.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteContentVersions =
	<Schema extends object>(keys: DirectusVersion<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/versions`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing Content Version.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteContentVersion =
	<Schema extends object>(key: DirectusVersion<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/versions/${key}`,
			method: 'DELETE',
		};
	};
