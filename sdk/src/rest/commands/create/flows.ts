import type { DirectusFlow } from '../../../schema/flow.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateFlowOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusFlow<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new flows.
 *
 * @param items The flows to create
 * @param query Optional return data query
 *
 * @returns Returns the flow object for the created flow.
 */
export const createFlows =
	<Schema extends object, const TQuery extends Query<Schema, DirectusFlow<Schema>>>(
		items: Partial<DirectusFlow<Schema>>[],
		query?: TQuery,
	): RestCommand<CreateFlowOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/flows`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new flow.
 *
 * @param item The flow to create
 * @param query Optional return data query
 *
 * @returns Returns the flow object for the created flow.
 */
export const createFlow =
	<Schema extends object, TQuery extends Query<Schema, DirectusFlow<Schema>>>(
		item: Partial<DirectusFlow<Schema>>,
		query?: TQuery,
	): RestCommand<CreateFlowOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/flows`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
