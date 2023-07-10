import type { DirectusTranslation } from '../../../schema/translation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateTranslationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusTranslation<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new translation.
 * @param items
 * @param query
 * @returns Returns the translation object for the created translation.
 */
export const createTranslations =
	<Schema extends object, TQuery extends Query<Schema, DirectusTranslation<Schema>>>(
		items: Partial<DirectusTranslation<Schema>>[],
		query?: TQuery
	): RestCommand<CreateTranslationOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/translations`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new translation.
 * @param item
 * @param query
 * @returns Returns the translation object for the created translation.
 */
export const createTranslation =
	<Schema extends object, TQuery extends Query<Schema, DirectusTranslation<Schema>>>(
		item: Partial<DirectusTranslation<Schema>>,
		query?: TQuery
	): RestCommand<CreateTranslationOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/translations`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
