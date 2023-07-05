import type { DirectusUser } from '../../../schema/user.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadUserMeOutput<
	Schema extends object,
	Collection extends keyof Schema | string,
	TQuery extends Query<Schema, Item>,
    Item = Collection extends keyof Schema ? Schema[Collection] : DirectusUser
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Retrieve the currently authenticated user.
 *
 * @param query The query parameters
 *
 * @returns Returns the user object for the currently authenticated user.
 */
export const readMe =
	<
		Schema extends object,
		TQuery extends Query<Schema, Collection extends keyof Schema ? Schema[Collection] : DirectusUser>,
        Collection extends keyof Schema | string = "directus_users",
	>(
		query?: TQuery
	): RestCommand<ReadUserMeOutput<Schema, Collection, TQuery>, Schema> =>
	() => ({
        path: `/users/me`,
        params: queryToParams(query ?? {}),
        method: 'GET',
	});
