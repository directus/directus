import type { DirectusPreset } from '../../../schema/preset.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreatePresetOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusPreset<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new presets.
 * @param items
 * @param query
 * @returns Returns the preset object for the created preset.
 */
export const createPresets =
	<Schema extends object, TQuery extends Query<Schema, DirectusPreset<Schema>>>(
		items: Partial<DirectusPreset<Schema>>[],
		query?: TQuery
	): RestCommand<CreatePresetOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new preset.
 * @param item
 * @param query
 * @returns Returns the preset object for the created preset.
 */
export const createPreset =
	<Schema extends object, TQuery extends Query<Schema, DirectusPreset<Schema>>>(
		item: Partial<DirectusPreset<Schema>>,
		query?: TQuery
	): RestCommand<CreatePresetOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
