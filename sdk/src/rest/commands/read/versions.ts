import type { DirectusVersion } from '../../../schema/version.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadVersionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusVersion<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all versions that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit version objects. If no items are available, data will be an empty array.
 */
export const readVersions =
	<Schema extends object, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		query?: TQuery
	): RestCommand<ReadVersionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/versions`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing version by primary key.
 * @param key The primary key of the version
 * @param query The query parameters
 * @returns Returns a version object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readVersion =
	<Schema extends object, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		key: DirectusVersion<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadVersionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/versions/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
