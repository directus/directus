import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadDashboardOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusDashboard<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all dashboards that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit dashboard objects. If no items are available, data will be an empty array.
 */
export const readDashboards =
	<Schema extends object, TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		query?: TQuery
	): RestCommand<ReadDashboardOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/dashboards`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});

/**
 * List an existing dashboard by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns the requested dashboard object.
 */
export const readDashboard =
	<Schema extends object, TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		key: DirectusDashboard<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadDashboardOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/dashboards/${key}`,
		params: queryToParams(query ?? {}),
		method: 'GET',
	});
