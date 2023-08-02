import type { DirectusFolder } from '../../../schema/folder.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type ReadFolderOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFolder<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all folders that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit folder objects. If no items are available, data will be an empty array.
 */
export const readFolders =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFolder<Schema>>>(
		query?: TQuery
	): RestCommand<ReadFolderOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/folders`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing folder by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a folder object if a valid primary key was provided.
 */
export const readFolder =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFolder<Schema>>>(
		key: DirectusFolder<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadFolderOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/folders/${key}`,
		params: query ?? {},
		method: 'GET',
	});
