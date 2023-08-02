import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import type { DirectusUser } from '../../../schema/user.js';

export type UpdateUserOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusUser<Schema>
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
export const updateUsers =
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		keys: DirectusUser<Schema>['id'][],
		item: Partial<DirectusUser<Schema>>,
		query?: TQuery
	): RestCommand<UpdateUserOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/users`,
		params: query ?? {},
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
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		key: DirectusUser<Schema>['id'],
		item: Partial<DirectusUser<Schema>>,
		query?: TQuery
	): RestCommand<UpdateUserOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/users/${key}`,
		params: query ?? {},
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
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		item: Partial<DirectusUser<Schema>>,
		query?: TQuery
	): RestCommand<UpdateUserOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/users/me`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
