import type { CoreCollection, Query } from '../../../types/index.js';
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
	<Schema extends object, TQuery extends Query<Schema, CoreCollection<Schema, 'directus_users', DirectusUser>>>(
		keysOrQuery: DirectusUser['id'][] | TQuery
	): RestCommand<void, Schema> =>
	() => ({
		path: `/users`,
		body: JSON.stringify(Array.isArray(keysOrQuery) ? { keys: keysOrQuery } : { query: keysOrQuery }),
		method: 'DELETE',
        onResponse: null,
	});

/**
 * Delete an existing user.
 *
 * @param key The primary key of the item
 *
 * @returns Nothing
 */
export const deleteUser =
	<Schema extends object>(key: DirectusUser['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/users/${key}`,
		method: 'DELETE',
        onResponse: null,
	});
