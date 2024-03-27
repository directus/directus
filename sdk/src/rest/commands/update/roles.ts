import type { DirectusRole } from '../../../schema/role.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateRoleOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusRole<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing roles.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the role objects for the updated roles.
 * @throws Will throw if keys is empty
 */
export const updateRoles =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRole<Schema>>>(
		keys: DirectusRole<Schema>['id'][],
		item: Partial<DirectusRole<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateRoleOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/roles`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing role.
 * @param key
 * @param item
 * @param query
 * @returns Returns the role object for the updated role.
 * @throws Will throw if key is empty
 */
export const updateRole =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRole<Schema>>>(
		key: DirectusRole<Schema>['id'],
		item: Partial<DirectusRole<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateRoleOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/roles/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
