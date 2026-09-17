import type { DirectusNotification } from '../../../schema/notification.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing notifications.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteNotifications =
	<Schema>(keys: DirectusNotification<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/notifications`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing notification.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteNotification =
	<Schema>(key: DirectusNotification<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/notifications/${key}`,
			method: 'DELETE',
		};
	};
