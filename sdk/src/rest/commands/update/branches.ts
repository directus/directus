import type { DirectusBranch } from '../../../schema/branch.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type UpdateBranchOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusBranch<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing branches.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the branch objects for the updated branches.
 * @throws Will throw if keys is empty
 */
export const updateBranches =
	<Schema extends object, const TQuery extends Query<Schema, DirectusBranch<Schema>>>(
		keys: DirectusBranch<Schema>['id'][],
		item: Partial<DirectusBranch<Schema>>,
		query?: TQuery
	): RestCommand<UpdateBranchOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/branches`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update an existing branch.
 * @param key
 * @param item
 * @param query
 * @returns Returns the branch object for the updated branch.
 * @throws Will throw if key is empty
 */
export const updateBranch =
	<Schema extends object, const TQuery extends Query<Schema, DirectusBranch<Schema>>>(
		key: DirectusBranch<Schema>['id'],
		item: Partial<DirectusBranch<Schema>>,
		query?: TQuery
	): RestCommand<UpdateBranchOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(key, 'Key cannot be empty');

		return {
			path: `/branches/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
