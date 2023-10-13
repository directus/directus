import type { DirectusBranch } from '../../../schema/branch.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateBranchOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusBranch<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create multiple new branches.
 *
 * @param item The branch to create
 * @param query Optional return data query
 *
 * @returns Returns the branch objects for the created branches.
 */
export const createContentVersions =
	<Schema extends object, const TQuery extends Query<Schema, DirectusBranch<Schema>>>(
		items: Partial<DirectusBranch<Schema>>[],
		query?: TQuery
	): RestCommand<CreateBranchOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/branches`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'POST',
	});

/**
 * Create a new branch.
 *
 * @param item The branch to create
 * @param query Optional return data query
 *
 * @returns Returns the branch object for the created branch.
 */
export const createContentVersion =
	<Schema extends object, const TQuery extends Query<Schema, DirectusBranch<Schema>>>(
		item: Partial<DirectusBranch<Schema>>,
		query?: TQuery
	): RestCommand<CreateBranchOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/branches`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
