import type { DirectusSettings } from '../../../schema/settings.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type ReadSettingOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusSettings<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Retrieve Settings.
 *
 * @param query The query parameters
 *
 * @returns Returns the settings object.
 */
export const readSettings =
	<Schema extends object, const TQuery extends Query<Schema, DirectusSettings<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadSettingOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/settings`,
		params: query ?? {},
		method: 'GET',
	});
