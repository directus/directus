import type { DirectusPanel } from '../../../schema/panel.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreatePanelOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPanel<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new panels.
 *
 * @param items The panel to create
 * @param query Optional return data query
 *
 * @returns Returns the panel object for the created panel.
 */
export const createPanels =
	<Schema, const TQuery extends Query<Schema, DirectusPanel<Schema>>>(
		items: NestedPartial<DirectusPanel<Schema>>[],
		query?: TQuery,
	): RestCommand<CreatePanelOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/panels`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new panel.
 *
 * @param item The panel to create
 * @param query Optional return data query
 *
 * @returns Returns the panel object for the created panel.
 */
export const createPanel =
	<Schema, const TQuery extends Query<Schema, DirectusPanel<Schema>>>(
		item: NestedPartial<DirectusPanel<Schema>>,
		query?: TQuery,
	): RestCommand<CreatePanelOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/panels`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
