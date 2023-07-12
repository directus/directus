import type { DirectusShare } from '../../../schema/share.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadShareOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusShare<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all Shares that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Share objects. If no items are available, data will be an empty array.
 */
export const readShares =
	<Schema extends object, TQuery extends Query<Schema, DirectusShare<Schema>>>(
		query?: TQuery
	): RestCommand<ReadShareOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/shares`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});

/**
 * List an existing Share by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Share object if a valid primary key was provided.
 */
export const readShare =
	<Schema extends object, TQuery extends Query<Schema, DirectusShare<Schema>>>(
		key: DirectusShare<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadShareOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/shares/${key}`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});
