import type { DirectusUser } from '../../../schema/user.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadUserOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusUser<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all users that exist in Directus.
 *
 * @param query The query parameters
 *
 * @returns An array of up to limit user objects. If no items are available, data will be an empty array.
 */
export const readUsers =
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadUserOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/users`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing user by primary key.
 *
 * @param key The primary key of the user
 * @param query The query parameters
 *
 * @returns Returns the requested user object.
 * @throws Will throw if key is empty
 */
export const readUser =
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		key: DirectusUser<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadUserOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/users/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};

/**
 * Retrieve the currently authenticated user.
 *
 * @param query The query parameters
 *
 * @returns Returns the user object for the currently authenticated user.
 */
export const readMe =
	<Schema extends object, const TQuery extends Query<Schema, DirectusUser<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadUserOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/users/me`,
		params: query ?? {},
		method: 'GET',
	});
