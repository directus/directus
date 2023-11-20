import type { DirectusTranslation } from '../../../schema/translation.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateTranslationOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusTranslation<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing translations.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the translation objects for the updated translations.
 * @throws Will throw if keys is empty
 */
export const updateTranslations =
	<Schema extends object, const TQuery extends Query<Schema, DirectusTranslation<Schema>>>(
		keys: DirectusTranslation<Schema>['id'][],
		item: Partial<DirectusTranslation<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateTranslationOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/translations`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing translation.
 * @param key
 * @param item
 * @param query
 * @returns Returns the translation object for the updated translation.
 * @throws Will throw if key is empty
 */
export const updateTranslation =
	<Schema extends object, const TQuery extends Query<Schema, DirectusTranslation<Schema>>>(
		key: DirectusTranslation<Schema>['id'],
		item: Partial<DirectusTranslation<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateTranslationOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/translations/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
