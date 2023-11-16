import type { DirectusPermission } from '../../../schema/permission.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing permissions rules
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deletePermissions =
	<Schema extends object>(keys: DirectusPermission<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/permissions`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing permissions rule
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deletePermission =
	<Schema extends object>(key: DirectusPermission<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/permissions/${key}`,
			method: 'DELETE',
		};
	};
