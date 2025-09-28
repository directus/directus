import type { DirectusTranslation } from '../../../schema/translation.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateTranslationOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusTranslation<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new translation.
 *
 * @param items The translations to create
 * @param query Optional return data query
 *
 * @returns Returns the translation object for the created translation.
 */
export const createTranslations =
	<Schema, const TQuery extends Query<Schema, DirectusTranslation<Schema>>>(
		items: NestedPartial<DirectusTranslation<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateTranslationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/translations`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new translation.
 *
 * @param item The translation to create
 * @param query Optional return data query
 *
 * @returns Returns the translation object for the created translation.
 */
export const createTranslation =
	<Schema, const TQuery extends Query<Schema, DirectusTranslation<Schema>>>(
		item: NestedPartial<DirectusTranslation<Schema>>,
		query?: TQuery,
	): RestCommand<CreateTranslationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/translations`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
