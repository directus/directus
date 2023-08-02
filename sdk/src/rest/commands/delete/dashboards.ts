import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { RestCommand } from '../../types.js';

/**
 * Delete multiple existing dashboards.
 * @param keysOrQuery
 * @returns
 */
export const deleteDashboards =
	<Schema extends object>(keys: DirectusDashboard<Schema>['id'][]): RestCommand<void, Schema> =>
	() => ({
		path: `/dashboards`,
		body: JSON.stringify(keys),
		method: 'DELETE',
	});

/**
 * Delete an existing dashboard.
 * @param key
 * @returns
 */
export const deleteDashboard =
	<Schema extends object>(key: DirectusDashboard<Schema>['id']): RestCommand<void, Schema> =>
	() => ({
		path: `/dashboards/${key}`,
		method: 'DELETE',
	});
