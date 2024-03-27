import type { DirectusActivity } from '../../../schema/activity.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateActivityOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusActivity<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Updates an existing comment by activity action primary key.
 * @param key
 * @param item
 * @param query
 * @returns Returns the activity object of the created comment.
 * @throws Will throw if key is empty
 */
export const updateComment =
	<Schema extends object, const TQuery extends Query<Schema, DirectusActivity<Schema>>>(
		key: DirectusActivity<Schema>['id'],
		item: Partial<DirectusActivity<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateActivityOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/activity/comment/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
