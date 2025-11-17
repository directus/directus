import type { DirectusWebhook } from '../../../schema/webhook.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateWebhookOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusWebhook<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing webhooks.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the webhook objects for the updated webhooks.
 * @throws Will throw if keys is empty
 */
export const updateWebhooks =
	<Schema, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		keys: DirectusWebhook<Schema>['id'][],
		item: NestedPartial<DirectusWebhook<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateWebhookOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/webhooks`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing webhook.
 * @param key
 * @param item
 * @param query
 * @returns Returns the webhook object for the updated webhook.
 * @throws Will throw if key is empty
 */
export const updateWebhook =
	<Schema, const TQuery extends Query<Schema, DirectusWebhook<Schema>>>(
		key: DirectusWebhook<Schema>['id'],
		item: NestedPartial<DirectusWebhook<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateWebhookOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/webhooks/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
