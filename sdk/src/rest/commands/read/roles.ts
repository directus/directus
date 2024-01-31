import type { DirectusRole } from '../../../schema/role.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadRoleOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusRole<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all Roles that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Role objects. If no items are available, data will be an empty array.
 */
export const readRoles =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRole<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadRoleOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/roles`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing Role by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Role object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readRole =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRole<Schema>>>(
		key: DirectusRole<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadRoleOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/roles/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
