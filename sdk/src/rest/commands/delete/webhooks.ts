import type { DirectusWebhook } from '../../../schema/webhook.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing webhooks.
 * @param keys
 * @returns
 */
export const deleteWebhooks =
	<Schema extends object>(keys: DirectusWebhook<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/webhooks`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing webhook.
 * @param key
 * @returns
 */
export const deleteWebhook =
	<Schema extends object>(key: DirectusWebhook<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/webhooks/${key}`,
		method: 'DELETE',
	});
