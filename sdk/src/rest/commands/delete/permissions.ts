import type { DirectusPermission } from '../../../schema/permission.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing permissions rules
 * @param keys
 * @returns
 */
export const deletePermissions =
	<Schema extends object>(keys: DirectusPermission<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/permissions`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing permissions rule
 * @param key
 * @returns
 */
export const deletePermission =
	<Schema extends object>(key: DirectusPermission<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/permissions/${key}`,
		method: 'DELETE',
	});
