import type { DirectusWebhook } from '../../../schema/webhook.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadWebhookOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusWebhook<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all Webhooks that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Webhook objects. If no items are available, data will be an empty array.
 */
export const readWebhooks =
	<Schema extends object, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadWebhookOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/webhooks`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing Webhook by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Webhook object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readWebhook =
	<Schema extends object, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		key: DirectusWebhook<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadWebhookOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/webhooks/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
