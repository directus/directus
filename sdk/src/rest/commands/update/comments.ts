import type { DirectusComment } from '../../../schema/comment.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type UpdateCommentOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusComment<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing comments.
 * @param keysOrQuery The primary keys or a query
 * @param item
 * @param query
 * @returns Returns the comment objects for the updated comments.
 * @throws Will throw if keys is empty
 */
export const updateComments =
	<Schema, const TQuery extends Query<Schema, DirectusComment<Schema>>>(
		keysOrQuery: DirectusComment<Schema>['id'][] | Query<Schema, DirectusComment<Schema>>,
		item: NestedPartial<DirectusComment<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateCommentOutput<Schema, TQuery>[], Schema> =>
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
			path: `/comments`,
			params: query ?? {},
			body: JSON.stringify(payload),
			method: 'PATCH',
		};
	};

/**
 * Update multiple comments as batch.
 * @param items
 * @param query
 * @returns Returns the comment objects for the updated comments.
 */
export const updateCommentsBatch =
	<Schema, const TQuery extends Query<Schema, DirectusComment<Schema>>>(
		items: NestedPartial<DirectusComment<Schema>>[],
		query?: TQuery,
	): RestCommand<UpdateCommentOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/comments`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'PATCH',
	});

/**
 * Update an existing comment.
 * @param key
 * @param item
 * @param query
 * @returns Returns the comment object for the updated comment.
 * @throws Will throw if key is empty
 */
export const updateComment =
	<Schema, const TQuery extends Query<Schema, DirectusComment<Schema>>>(
		key: DirectusComment<Schema>['id'],
		item: NestedPartial<DirectusComment<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateCommentOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/comments/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
