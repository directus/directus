import type { DirectusOperation } from '../../../schema/operation.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing operations.
 * @param keys
 * @returns
 */
export const deleteOperations =
	<Schema extends object>(keys: DirectusOperation<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/operations`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing operation.
 * @param key
 * @returns
 */
export const deleteOperation =
	<Schema extends object>(key: DirectusOperation<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/operations/${key}`,
		method: 'DELETE',
	});
