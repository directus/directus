import type { DirectusRole } from '../../../schema/role.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateRoleOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusRole<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing roles.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the role objects for the updated roles.
 */
export const updateRoles =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRole<Schema>>>(
		keys: DirectusRole<Schema>['id'][],
		item: Partial<DirectusRole<Schema>>,
		query?: TQuery
	): RestCommand<UpdateRoleOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/roles`,
		params: query ?? {},
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing role.
 * @param key
 * @param item
 * @param query
 * @returns Returns the role object for the updated role.
 */
export const updateRole =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRole<Schema>>>(
		key: DirectusRole<Schema>['id'],
		item: Partial<DirectusRole<Schema>>,
		query?: TQuery
	): RestCommand<UpdateRoleOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/roles/${key}`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
