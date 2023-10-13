import type { DirectusBranch } from '../../../schema/branch.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing branches.
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteBranches =
	<Schema extends object>(keys: DirectusBranch<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/branches`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing branch.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteBranch =
	<Schema extends object>(key: DirectusBranch<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/branches/${key}`,
			method: 'DELETE',
		};
	};
