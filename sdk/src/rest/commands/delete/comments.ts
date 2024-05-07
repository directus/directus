import type { DirectusComment } from '../../../schema/comment.js';
import type { Query } from '../../../types/query.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing comments.
 * @param keysOrQuery The primary keys or a query
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteComments =
	<Schema>(
		keysOrQuery: DirectusComment<Schema>['id'][] | Query<Schema, DirectusComment<Schema>>,
	): RestCommand<void, Schema> =>
	() => {
		let payload: Record<string, any> = {};

		if (Array.isArray(keysOrQuery)) {
			throwIfEmpty(keysOrQuery, 'keysOrQuery cannot be empty');
			payload = { keys: keysOrQuery };
		} else {
			throwIfEmpty(Object.keys(keysOrQuery), 'keysOrQuery cannot be empty');
			payload = { query: keysOrQuery };
		}

		return {
			path: `/comments`,
			body: JSON.stringify(payload),
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
