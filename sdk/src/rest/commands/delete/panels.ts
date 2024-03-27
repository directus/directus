import type { DirectusPanel } from '../../../schema/panel.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing panels.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deletePanels =
	<Schema extends object>(keys: DirectusPanel<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/panels`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing panel.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deletePanel =
	<Schema extends object>(key: DirectusPanel<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/panels/${key}`,
			method: 'DELETE',
		};
	};
