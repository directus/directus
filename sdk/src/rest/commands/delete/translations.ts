import type { DirectusTranslation } from '../../../schema/translation.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing translations.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteTranslations =
	<Schema extends object>(keys: DirectusTranslation<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/translations`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing translation.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteTranslation =
	<Schema extends object>(key: DirectusTranslation<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/translations/${key}`,
			method: 'DELETE',
		};
	};
