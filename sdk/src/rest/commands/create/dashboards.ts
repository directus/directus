import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateDashboardOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusDashboard<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new dashboards.
 *
 * @param items The items to create
 * @param query Optional return data query
 *
 * @returns Returns the dashboard object for the created dashboards.
 */
export const createDashboards =
	<Schema extends object, TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		items: Partial<DirectusDashboard<Schema>>[],
		query?: TQuery
	): RestCommand<CreateDashboardOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/dashboards`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new dashboard.
 *
 * @param item The dashboard to create
 * @param query Optional return data query
 *
 * @returns Returns the dashboard object for the created dashboard.
 */
export const createDashboard =
	<Schema extends object, TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		item: Partial<DirectusDashboard<Schema>>,
		query?: TQuery
	): RestCommand<CreateDashboardOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/dashboards`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
