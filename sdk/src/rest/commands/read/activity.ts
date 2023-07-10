import type { DirectusActivity } from '../../../schema/activity.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadActivityOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusActivity<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Returns a list of activity actions.
 * @param query The query parameters
 * @returns An array of up to limit activity objects. If no items are available, data will be an empty array.
 */
export const readActivities =
	<
		Schema extends object,
		TQuery extends Query<Schema, DirectusActivity<Schema>>
	>(
		query?: TQuery
	): RestCommand<ReadActivityOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/activity`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});

/**
 * Returns a single activity action by primary key.
 * @param key The primary key of the activity
 * @param query The query parameters
 * @returns Returns an activity object if a valid identifier was provided.
 */
export const readActivity =
	<
		Schema extends object,
		TQuery extends Query<Schema, DirectusActivity<Schema>>
	>(
		key: DirectusActivity<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadActivityOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/activity/${key}`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});
