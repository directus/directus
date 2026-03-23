import type { DirectusUser } from '../../../schema/user.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing users.
 *
 * @param keys
 * @returns Nothing
 * @throws Will throw if keys is empty
 */
export const deleteUsers =
	<Schema>(keys: DirectusUser<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/users`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing user.
 *
 * @param key
 * @returns Nothing
 * @throws Will throw if key is empty
 */
export const deleteUser =
	<Schema>(key: DirectusUser<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/users/${key}`,
			method: 'DELETE',
		};
	};
