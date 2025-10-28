import type { DirectusWebhook } from '../../../schema/webhook.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateWebhookOutput<
	Schema,
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
	<Schema, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		items: NestedPartial<DirectusWebhook<Schema>>[],
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
	<Schema, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		item: NestedPartial<DirectusWebhook<Schema>>,
		query?: TQuery,
	): RestCommand<CreateWebhookOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/webhooks`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
