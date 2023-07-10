import type { DirectusPermission } from '../../../schema/permission.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';


export type UpdatePermissionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusPermission<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing permissions rules.
 * @param keys 
 * @param item 
 * @param query 
 * @returns Returns the permission object for the updated permissions.
 */
export const updatedPermissions =
	<Schema extends object, TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		keys: DirectusPermission<Schema>['id'][],
		item: Partial<DirectusPermission<Schema>>,
		query?: TQuery
	): RestCommand<UpdatePermissionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/permissions`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing permissions rule.
 * @param key 
 * @param item 
 * @param query 
 * @returns Returns the permission object for the updated permission.
 */
export const updatePermission =
	<Schema extends object, TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		key: DirectusPermission<Schema>['id'],
		item: Partial<DirectusPermission<Schema>>,
		query?: TQuery
	): RestCommand<UpdatePermissionOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/permissions/${key}`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'PATCH',
	});