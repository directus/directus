import type { DirectusBranch } from '../../../schema/branch.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type ReadBranchOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusBranch<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all existing branches.
 * @param query The query parameters
 * @returns An array of up to limit branch objects. If no items are available, data will be an empty array.
 */
export const readBranches =
	<Schema extends object, const TQuery extends Query<Schema, DirectusBranch<Schema>>>(
		query?: TQuery
	): RestCommand<ReadBranchOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/branches`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing branch by primary key.
 * @param key The primary key of the branch
 * @param query The query parameters
 * @returns Returns a branch object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readBranch =
	<Schema extends object, const TQuery extends Query<Schema, DirectusBranch<Schema>>>(
		key: DirectusBranch<Schema>['id'],
		query?: TQuery
	): RestCommand<ReadBranchOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/branches/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
