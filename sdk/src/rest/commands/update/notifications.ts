import type { DirectusNotification } from '../../../schema/notification.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateNotificationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusNotification<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing notifications.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the notification objects for the updated notifications.
 */
export const updateNotifications =
	<Schema extends object, const TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		keys: DirectusNotification<Schema>['id'][],
		item: Partial<DirectusNotification<Schema>>,
		query?: TQuery
	): RestCommand<UpdateNotificationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/notifications`,
		params: query ?? {},
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing notification.
 * @param key
 * @param item
 * @param query
 * @returns Returns the notification object for the updated notification.
 */
export const updateNotification =
	<Schema extends object, const TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		key: DirectusNotification<Schema>['id'],
		item: Partial<DirectusNotification<Schema>>,
		query?: TQuery
	): RestCommand<UpdateNotificationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/notifications/${key}`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
