import type { DirectusVersion } from '../../../schema/version.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateContentVersionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusVersion<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new versions.
 *
 * @param item The version to create
 * @param query Optional return data query
 *
 * @returns Returns the version object for the created version.
 */
export const createContentVersions =
	<Schema extends object, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		items: Partial<DirectusVersion<Schema>>[],
		query?: TQuery
	): RestCommand<CreateContentVersionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/versions`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new version.
 *
 * @param item The version to create
 * @param query Optional return data query
 *
 * @returns Returns the version object for the created version.
 */
export const createContentVersion =
	<Schema extends object, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		item: Partial<DirectusVersion<Schema>>,
		query?: TQuery
	): RestCommand<CreateContentVersionOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/versions`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
