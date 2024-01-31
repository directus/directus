import type { DirectusWebhook } from '../../../schema/webhook.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateWebhookOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusWebhook<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new webhooks.
 *
 * @param items The webhooks to create
 * @param query Optional return data query
 *
 * @returns Returns the webhook objects for the created webhooks.
 */
export const createWebhooks =
	<Schema extends object, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		items: Partial<DirectusWebhook<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateWebhookOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/webhooks`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new webhook.
 *
 * @param item The webhook to create
 * @param query Optional return data query
 *
 * @returns Returns the webhook object for the created webhook.
 */
export const createWebhook =
	<Schema extends object, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		item: Partial<DirectusWebhook<Schema>>,
		query?: TQuery,
	): RestCommand<CreateWebhookOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/webhooks`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
