import type { DirectusComment } from '../../../schema/comment.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateCommentOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusComment<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new comments.
 *
 * @param items The comments to create
 * @param query Optional return data query
 *
 * @returns Returns the comment object for the created comment.
 */
export const createComments =
	<Schema, const TQuery extends Query<Schema, DirectusComment<Schema>>>(
		items: NestedPartial<DirectusComment<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateCommentOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/comments`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new comment.
 *
 * @param item The comment to create
 * @param query Optional return data query
 *
 * @returns Returns the comment object for the created comment.
 */
export const createComment =
	<Schema, const TQuery extends Query<Schema, DirectusComment<Schema>>>(
		item: NestedPartial<DirectusComment<Schema>>,
		query?: TQuery,
	): RestCommand<CreateCommentOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/comments`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
