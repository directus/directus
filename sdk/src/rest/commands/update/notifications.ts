import type { DirectusNotification } from '../../../schema/notification.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
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
		keysOrQuery: DirectusNotification<Schema>['id'][] | Query<Schema, DirectusNotification<Schema>>,
		item: Partial<DirectusNotification<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateNotificationOutput<Schema, TQuery>[], Schema> =>
	() => {
		let payload: Record<string, any> = {};

		if (Array.isArray(keysOrQuery)) {
			throwIfEmpty(keysOrQuery, 'keysOrQuery cannot be empty');
			payload = { keys: keysOrQuery };
		} else {
			throwIfEmpty(Object.keys(keysOrQuery), 'keysOrQuery cannot be empty');
			payload = { query: keysOrQuery };
		}

		payload['data'] = item;

		return {
			path: `/notifications`,
			params: query ?? {},
			body: JSON.stringify(payload),
			method: 'PATCH',
		};
	};

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
