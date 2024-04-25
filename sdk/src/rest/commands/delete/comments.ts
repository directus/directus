import type { DirectusComment } from '../../../schema/comment.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing comments.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteComments =
	<Schema>(keys: DirectusComment<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/comments`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing comment.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteComment =
	<Schema>(key: DirectusComment<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/comments/${key}`,
			method: 'DELETE',
		};
	};
