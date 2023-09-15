import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing dashboards.
 * @param keysOrQuery
 * @returns
 * @throws Will throw if keys is empty
 */
export const deleteDashboards =
	<Schema extends object>(keys: DirectusDashboard<Schema>['id'][]): RestCommand<void, Schema> =>
	() => {
		if (keys.length === 0) {
			throw new Error('Keys cannot be empty');
		}

		return {
			path: `/dashboards`,
			body: JSON.stringify(keys),
			method: 'DELETE',
		};
	};

/**
 * Delete an existing dashboard.
 * @param key
 * @returns
 * @throws Will throw if key is empty
 */
export const deleteDashboard =
	<Schema extends object>(key: DirectusDashboard<Schema>['id']): RestCommand<void, Schema> =>
	() => {
		if (key.length === 0) {
			throw new Error('Key cannot be empty');
		}

		return {
			path: `/dashboards/${key}`,
			method: 'DELETE',
		};
	};
