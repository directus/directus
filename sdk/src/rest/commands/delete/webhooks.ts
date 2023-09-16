import type { DirectusWebhook } from '../../../schema/webhook.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing webhooks.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteWebhooks =
	<Schema extends object>(keys: DirectusWebhook<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/webhooks`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing webhook.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteWebhook =
	<Schema extends object>(key: DirectusWebhook<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/webhooks/${key}`,
			method: 'DELETE',
		};
	};
