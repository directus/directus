import type { DirectusActivity } from '../../../schema/activity.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadActivityOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusActivity<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Returns a list of activity actions.
 * @param query The query parameters
 * @returns An array of up to limit activity objects. If no items are available, data will be an empty array.
 */
export const readActivities =
	<Schema extends object, const TQuery extends Query<Schema, DirectusActivity<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadActivityOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/activity`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * Returns a single activity action by primary key.
 * @param key The primary key of the activity
 * @param query The query parameters
 * @returns Returns an activity object if a valid identifier was provided.
 * @throws Will throw if key is empty
 */
export const readActivity =
	<Schema extends object, const TQuery extends Query<Schema, DirectusActivity<Schema>>>(
		key: DirectusActivity<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadActivityOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/activity/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
