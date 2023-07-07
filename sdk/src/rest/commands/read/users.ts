import type { DirectusUser } from '../../../schema/user.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadUserOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusUser<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all users that exist in Directus.
 *
 * @param query The query parameters
 *
 * @returns AAn array of up to limit user objects. If no items are available, data will be an empty array.
 */
export const readUsers =
	<
		Schema extends object,
		TQuery extends Query<Schema, DirectusUser<Schema>>
	>(
		query?: TQuery
	): RestCommand<ReadUserOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/users`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});

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
		TQuery extends Query<Schema, DirectusUser<Schema>>
	>(
		key: DirectusUser<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadUserOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/users/${key}`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});

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
		TQuery extends Query<Schema, DirectusUser<Schema>>
	>(
		query?: TQuery
	): RestCommand<ReadUserOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/users/me`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});
