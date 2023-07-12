import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type UpdateDashboardOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusDashboard<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing dashboards.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the dashboard objects for the updated dashboards.
 */
export const updatedDashboards =
	<Schema extends object, TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		keys: DirectusDashboard<Schema>['id'][],
		item: Partial<DirectusDashboard<Schema>>,
		query?: TQuery
	): RestCommand<UpdateDashboardOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/dashboards`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing dashboard.
 * @param key
 * @param item
 * @param query
 * @returns Returns the dashboard object for the updated dashboard.
 */
export const updateDashboard =
	<Schema extends object, TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		key: DirectusDashboard<Schema>['id'],
		item: Partial<DirectusDashboard<Schema>>,
		query?: TQuery
	): RestCommand<UpdateDashboardOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/dashboards/${key}`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'PATCH',
	});
