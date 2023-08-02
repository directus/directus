import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateDashboardOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDashboard<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing dashboards.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the dashboard objects for the updated dashboards.
 */
export const updateDashboards =
	<Schema extends object, const TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		keys: DirectusDashboard<Schema>['id'][],
		item: Partial<DirectusDashboard<Schema>>,
		query?: TQuery
	): RestCommand<UpdateDashboardOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/dashboards`,
		params: query ?? {},
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
	<Schema extends object, const TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		key: DirectusDashboard<Schema>['id'],
		item: Partial<DirectusDashboard<Schema>>,
		query?: TQuery
	): RestCommand<UpdateDashboardOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/dashboards/${key}`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'PATCH',
	});
