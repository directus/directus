import type { DirectusNotification } from '../../../schema/notification.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateNotificationOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusNotification<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing notifications.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the notification objects for the updated notifications.
 * @throws Will throw if keys is empty
 */
export const updateNotifications =
	<Schema, const TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		keys: DirectusNotification<Schema>['id'][],
		item: Partial<DirectusNotification<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateNotificationOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/notifications`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update multiple notifications as batch.
 * @param items
 * @param query
 * @returns Returns the notification objects for the updated notifications.
 */
export const updateNotificationsBatch =
	<Schema, const TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		items: NestedPartial<DirectusNotification<Schema>>[],
		query?: TQuery,
	): RestCommand<UpdateNotificationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/notifications`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'PATCH',
	});

/**
 * Update an existing notification.
 * @param key
 * @param item
 * @param query
 * @returns Returns the notification object for the updated notification.
 * @throws Will throw if key is empty
 */
export const updateNotification =
	<Schema, const TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		key: DirectusNotification<Schema>['id'],
		item: Partial<DirectusNotification<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateNotificationOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/notifications/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
