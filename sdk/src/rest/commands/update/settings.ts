import type { DirectusSettings } from '../../../schema/settings.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateSettingOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusSettings<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update Settings
 * @param item
 * @param query
 * @returns Returns the settings object.
 */
export const updateSettings =
	<Schema extends object, const TQuery extends Query<Schema, DirectusSettings<Schema>>>(
		item: Partial<DirectusSettings<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateSettingOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/settings`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
