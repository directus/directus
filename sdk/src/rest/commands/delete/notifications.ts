import type { DirectusNotification } from '../../../schema/notification.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing notifications.
 * @param keys
 * @returns
 */
export const deleteNotifications =
	<Schema extends object>(keys: DirectusNotification<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/notifications`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing notification.
 * @param key
 * @returns
 */
export const deleteNotification =
	<Schema extends object>(key: DirectusNotification<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/notifications/${key}`,
		method: 'DELETE',
	});
