import type { DirectusActivity } from '../../../schema/activity.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateActivityOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusActivity<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Creates a new comment on a given item.
 *
 * @param items The items to create
 * @param query Optional return data query
 *
 * @returns Returns the activity object of the created comment.
 */
export const createComment =
	<Schema extends object, const TQuery extends Query<Schema, DirectusActivity<Schema>>>(
		item: Partial<DirectusActivity<Schema>>,
		query?: TQuery,
	): RestCommand<CreateActivityOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/activity/comment`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
