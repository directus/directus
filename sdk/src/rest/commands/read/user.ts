import type { PrimaryKey } from '@directus/types';
import type { DirectusUser } from '../../../schema/user.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadUserOutput<
	Schema extends object,
	Collection extends keyof Schema | string,
	TQuery extends Query<Schema, Item>,
    Item = Collection extends keyof Schema ? Schema[Collection] : DirectusUser
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List an existing user by primary key.
 *
 * @param key The primary key of the user
 * @param query The query parameters
 *
 * @returns Returns the requested user object.
 */
export const readUser =
	<
		Schema extends object,
		TQuery extends Query<Schema, Collection extends keyof Schema ? Schema[Collection] : DirectusUser>,
        Collection extends keyof Schema | string = "directus_users",
	>(
		key: PrimaryKey,
		query?: TQuery
	): RestCommand<ReadUserOutput<Schema, Collection, TQuery>, Schema> =>
	() => ({
        path: `/users/${key}`,
        params: queryToParams(query ?? {}),
        method: 'GET',
	});
