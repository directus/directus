import type { DirectusVersion } from '../../../schema/version.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateContentVersionOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusVersion<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new Content Versions.
 *
 * @param items The Content Versions to create
 * @param query Optional return data query
 *
 * @returns Returns the Content Version object for the created Content Versions.
 */
export const createContentVersions =
	<Schema, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		items: NestedPartial<DirectusVersion<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateContentVersionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/versions`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new Content Version.
 *
 * @param item The Content Version to create
 * @param query Optional return data query
 *
 * @returns Returns the Content Version object for the created Content Version.
 */
export const createContentVersion =
	<Schema, const TQuery extends Query<Schema, DirectusVersion<Schema>>>(
		item: NestedPartial<DirectusVersion<Schema>>,
		query?: TQuery,
	): RestCommand<CreateContentVersionOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/versions`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
