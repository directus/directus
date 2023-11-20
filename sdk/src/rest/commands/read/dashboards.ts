import type { DirectusDashboard } from '../../../schema/dashboard.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadDashboardOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDashboard<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all dashboards that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit dashboard objects. If no items are available, data will be an empty array.
 */
export const readDashboards =
	<Schema extends object, const TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadDashboardOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/dashboards`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing dashboard by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns the requested dashboard object.
 * @throws Will throw if key is empty
 */
export const readDashboard =
	<Schema extends object, const TQuery extends Query<Schema, DirectusDashboard<Schema>>>(
		key: DirectusDashboard<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadDashboardOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/dashboards/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
