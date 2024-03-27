import type { DirectusShare } from '../../../schema/share.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateShareOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusShare<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new shares.
 *
 * @param items The shares to create
 * @param query Optional return data query
 *
 * @returns Returns the share objects for the created shares.
 */
export const createShares =
	<Schema extends object, const TQuery extends Query<Schema, DirectusShare<Schema>>>(
		items: Partial<DirectusShare<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateShareOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/shares`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new share.
 *
 * @param item The share to create
 * @param query Optional return data query
 *
 * @returns Returns the share object for the created share.
 */
export const createShare =
	<Schema extends object, const TQuery extends Query<Schema, DirectusShare<Schema>>>(
		item: Partial<DirectusShare<Schema>>,
		query?: TQuery,
	): RestCommand<CreateShareOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/shares`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
