import type { DirectusPermission } from '../../../schema/permission.js';
import type { AllCollections, ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type ReadPermissionOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPermission<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

export type ReadItemPermissionsOutput = {
	update: { access: boolean; presets?: Record<string, any> | null; fields?: string[] | null };
	delete: { access: boolean };
	share: { access: boolean };
};

/**
 * List all Permissions that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Permission objects. If no items are available, data will be an empty array.
 */
export const readPermissions =
	<Schema, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadPermissionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/permissions`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List all Permissions that exist in Directus.
 * @param key The primary key of the permission
 * @param query The query parameters
 * @returns Returns a Permission object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readPermission =
	<Schema, const TQuery extends Query<Schema, DirectusPermission<Schema>>>(
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

/**
 * Check the current user's permissions on a specific item.
 * @param collection The collection of the item
 * @param key The primary key of the item
 * @returns Returns a ItemPermissions object if a valid collection / primary key was provided.
 */
export const readItemPermissions =
	<Schema, Collection extends AllCollections<Schema>>(
		collection: Collection,
		key?: string | number,
	): RestCommand<ReadItemPermissionsOutput, Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');

		const item = key ? `${collection as string}/${key}` : `${collection as string}`;

		return {
			path: `/permissions/me/${item}`,
			method: 'GET',
		};
	};
