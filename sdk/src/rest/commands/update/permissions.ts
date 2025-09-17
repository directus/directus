import type { DirectusPermission } from '../../../schema/permission.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdatePermissionOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPermission<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing permissions rules.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the permission object for the updated permissions.
 * @throws Will throw if keys is empty
 */
export const updatePermissions =
	<Schema, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		keys: DirectusPermission<Schema>['id'][],
		item: NestedPartial<DirectusPermission<Schema>>,
		query?: TQuery,
	): RestCommand<UpdatePermissionOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/permissions`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update multiple permissions rules as batch.
 * @param items
 * @param query
 * @returns Returns the permission object for the updated permissions.
 */
export const updatePermissionsBatch =
	<Schema, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		items: NestedPartial<DirectusPermission<Schema>>[],
		query?: TQuery,
	): RestCommand<UpdatePermissionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/permissions`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'PATCH',
	});

/**
 * Update an existing permissions rule.
 * @param key
 * @param item
 * @param query
 * @returns Returns the permission object for the updated permission.
 * @throws Will throw if key is empty
 */
export const updatePermission =
	<Schema, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		key: DirectusPermission<Schema>['id'],
		item: NestedPartial<DirectusPermission<Schema>>,
		query?: TQuery,
	): RestCommand<UpdatePermissionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/permissions/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
