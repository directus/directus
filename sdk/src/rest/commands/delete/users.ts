import type { RestCommand } from '../../types.js';
import type { DirectusUser } from '../../../schema/user.js';

/**
 * Delete multiple existing users.
 *
 * @param keysOrQuery The primary keys or a query
 *
 * @returns Nothing
 */
export const deleteUsers =
	<Schema extends object>(keys: DirectusUser<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/users`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing user.
 *
 * @param key The primary key of the item
 *
 * @returns Nothing
 */
export const deleteUser =
	<Schema extends object>(key: DirectusUser<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/users/${key}`,
		method: 'DELETE',
	});
