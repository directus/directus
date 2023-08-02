import type { DirectusRole } from '../../../schema/role.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing roles.
 * @param keys
 * @returns
 */
export const deleteRoles =
	<Schema extends object>(keys: DirectusRole<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/roles`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing role.
 * @param key
 * @returns
 */
export const deleteRole =
	<Schema extends object>(key: DirectusRole<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/roles/${key}`,
		method: 'DELETE',
	});
