import type { DirectusUser } from '../../../schema/user.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateUserOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusUser<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new users.
 *
 * @param items The items to create
 * @param query Optional return data query
 *
 * @returns Returns the user objects for the created users.
 */
export const createUsers =
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		items: Partial<DirectusUser<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateUserOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/users`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new user.
 *
 * @param item The user to create
 * @param query Optional return data query
 *
 * @returns Returns the user object for the created user.
 */
export const createUser =
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		item: Partial<DirectusUser<Schema>>,
		query?: TQuery,
	): RestCommand<CreateUserOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/users`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
