import type { PrimaryKey } from '@directus/types';
import type { ApplyQueryFields, CoreCollection, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';
import type { DirectusUser } from '../../../schema/user.js';

export type UpdateUserOutput<
	Schema extends object,
	Collection extends keyof Schema | string,
	TQuery extends Query<Schema, Item>,
	Item = CoreCollection<Schema, Collection, DirectusUser>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing users.
 *
 * @param keys The primary key of the users
 * @param item The user data to update
 * @param query Optional return data query
 *
 * @returns Returns the user objects for the updated users.
 */
export const updatedUsers =
	<
		Schema extends object,
		TQuery extends Query<Schema, CoreCollection<Schema, Collection, DirectusUser>>,
		Collection extends keyof Schema | string = 'directus_users'
	>(
		keys: PrimaryKey[],
		item: Partial<CoreCollection<Schema, Collection, DirectusUser>>,
		query?: TQuery
	): RestCommand<UpdateUserOutput<Schema, Collection, TQuery>[], Schema> =>
	() => ({
		path: `/users`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing user.
 *
 * @param key The primary key of the user
 * @param item The user data to update
 * @param query Optional return data query
 *
 * @returns Returns the user object for the updated user.
 */
export const updateUser =
	<
		Schema extends object,
		TQuery extends Query<Schema, CoreCollection<Schema, Collection, DirectusUser>>,
		Collection extends keyof Schema | string = 'directus_users'
	>(
		key: PrimaryKey,
		item: Partial<CoreCollection<Schema, Collection, DirectusUser>>,
		query?: TQuery
	): RestCommand<UpdateUserOutput<Schema, Collection, TQuery>, Schema> =>
	() => ({
		path: `/users/${key}`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'PATCH',
	});

/**
 * Update the authenticated user.
 *
 * @param item The user data to update
 * @param query Optional return data query
 *
 * @returns Returns the updated user object for the authenticated user.
 */
export const updateMe =
	<
		Schema extends object,
		TQuery extends Query<Schema, CoreCollection<Schema, Collection, DirectusUser>>,
		Collection extends keyof Schema | string = 'directus_users'
	>(
		item: Partial<CoreCollection<Schema, Collection, DirectusUser>>,
		query?: TQuery
	): RestCommand<UpdateUserOutput<Schema, Collection, TQuery>, Schema> =>
	() => ({
		path: `/users/me`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'PATCH',
	});
