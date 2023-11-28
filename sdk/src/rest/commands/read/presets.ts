import type { DirectusPreset } from '../../../schema/preset.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadPresetOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPreset<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all Presets that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Preset objects. If no items are available, data will be an empty array.
 */
export const readPresets =
	<Schema extends object, const TQuery extends Query<Schema, DirectusPreset<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadPresetOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/presets`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing preset by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Preset object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readPreset =
	<Schema extends object, const TQuery extends Query<Schema, DirectusPreset<Schema>>>(
		key: DirectusPreset<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadPresetOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/presets/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
