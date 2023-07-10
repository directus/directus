import type { DirectusTranslation } from '../../../schema/translation.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing translations.
 * @param keys
 * @returns
 */
export const deleteTranslations =
	<Schema extends object>(keys: DirectusTranslation<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/`,
		body: JSON.stringify(keys),
		method: 'DELETE',
		onResponse: null,
	});

/**
 * Delete an existing translation.
 * @param key
 * @returns
 */
export const deleteTranslation =
	<Schema extends object>(key: DirectusTranslation<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `//${key}`,
		method: 'DELETE',
		onResponse: null,
	});
