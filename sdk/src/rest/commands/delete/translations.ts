import type { DirectusTranslation } from '../../../schema/translation.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing translations.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteTranslations =
	<Schema>(keys: DirectusTranslation<Schema>['id'][]): RestCommand<void, Schema> =>
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
	<Schema>(key: DirectusTranslation<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/translations/${key}`,
			method: 'DELETE',
		};
	};
