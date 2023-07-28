import type { DirectusPreset } from '../../../schema/preset.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing presets.
 * @param keys
 * @returns
 */
export const deletePresets =
	<Schema extends object>(keys: DirectusPreset<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/presets`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing preset.
 * @param key
 * @returns
 */
export const deletePreset =
	<Schema extends object>(key: DirectusPreset<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/presets/${key}`,
		method: 'DELETE',
	});
