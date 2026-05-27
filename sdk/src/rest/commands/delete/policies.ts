import type { DirectusPolicy } from '../../../schema/policy.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete multiple existing policies
 * @param keys
 * @returns
 * @throws Will throw if keys is empty
 */
export const deletePolicies =
	<Schema>(keys: DirectusPolicy<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/policies`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing policy
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deletePolicy =
	<Schema>(key: DirectusPolicy<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/policies/${key}`,
			method: 'DELETE',
		};
	};
