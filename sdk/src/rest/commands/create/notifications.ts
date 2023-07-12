import type { DirectusNotification } from '../../../schema/notification.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateNotificationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusNotification<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new notifications.
 * @param items The notifications to create
 * @param query Optional return data query
 * @returns Returns the notification object for the created notification.
 */
export const createNotifications =
	<Schema extends object, TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		items: Partial<DirectusNotification<Schema>>[],
		query?: TQuery
	): RestCommand<CreateNotificationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/notifications`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new notification.
 * @param item The notification to create
 * @param query Optional return data query
 * @returns Returns the notification object for the created notification.
 */
export const createNotification =
	<Schema extends object, TQuery extends Query<Schema, DirectusNotification<Schema>>>(
		item: Partial<DirectusNotification<Schema>>,
		query?: TQuery
	): RestCommand<CreateNotificationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/notifications`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
