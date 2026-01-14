import type { DirectusFlow } from '../../../schema/flow.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing flows.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteFlows =
	<Schema>(keys: DirectusFlow<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/flows`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing flow.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteFlow =
	<Schema>(key: DirectusFlow<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/flows/${key}`,
			method: 'DELETE',
		};
	};
