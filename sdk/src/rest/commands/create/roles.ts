import type { DirectusRole } from '../../../schema/role.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateRoleOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusRole<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new roles.
 *
 * @param items The roles to create
 * @param query Optional return data query
 *
 * @returns Returns the role objects for the created roles.
 */
export const createRoles =
	<Schema extends object, TQuery extends Query<Schema, DirectusRole<Schema>>>(
		items: Partial<DirectusRole<Schema>>[],
		query?: TQuery
	): RestCommand<CreateRoleOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/roles`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new role.
 *
 * @param item The role to create
 * @param query Optional return data query
 *
 * @returns Returns the role object for the created role.
 */
export const createRole =
	<Schema extends object, TQuery extends Query<Schema, DirectusRole<Schema>>>(
		item: Partial<DirectusRole<Schema>>,
		query?: TQuery
	): RestCommand<CreateRoleOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/roles`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
