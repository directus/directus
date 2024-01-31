import type { DirectusFlow } from '../../../schema/flow.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateFlowOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFlow<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing flows.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the flow objects for the updated flows.
 * @throws Will throw if keys is empty
 */
export const updateFlows =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFlow<Schema>>>(
		keys: DirectusFlow<Schema>['id'][],
		item: Partial<DirectusFlow<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateFlowOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/flows`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing flow.
 * @param key
 * @param item
 * @param query
 * @returns Returns the flow object for the updated flow.
 * @throws Will throw if key is empty
 */
export const updateFlow =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFlow<Schema>>>(
		key: DirectusFlow<Schema>['id'],
		item: Partial<DirectusFlow<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateFlowOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/flows/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
