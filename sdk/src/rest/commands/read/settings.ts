import type { DirectusSettings } from '../../../schema/settings.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadSettingOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusSettings<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Retrieve Settings.
 *
 * @param query The query parameters
 *
 * @returns Returns the settings object.
 */
export const readSettings =
	<Schema extends object, TQuery extends Query<Schema, DirectusSettings<Schema>>>(
		query?: TQuery
	): RestCommand<ReadSettingOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/settings`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});
