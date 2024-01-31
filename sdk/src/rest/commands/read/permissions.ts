import type { DirectusPermission } from '../../../schema/permission.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadPermissionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPermission<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all Permissions that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Permission objects. If no items are available, data will be an empty array.
 */
export const readPermissions =
	<Schema extends object, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadPermissionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/permissions`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List all Permissions that exist in Directus.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Permission object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readPermission =
	<Schema extends object, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		key: DirectusPermission<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadPermissionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/permissions/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
