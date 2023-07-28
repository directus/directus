import type { DirectusFlow } from '../../../schema/flow.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing flows.
 * @param keys
 * @returns
 */
export const deleteFlows =
	<Schema extends object>(keys: DirectusFlow<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/flows`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing flow.
 * @param key
 * @returns
 */
export const deleteFlow =
	<Schema extends object>(key: DirectusFlow<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/flows/${key}`,
		method: 'DELETE',
	});
