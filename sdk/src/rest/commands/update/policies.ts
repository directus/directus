import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';
import type { DirectusPolicy } from '../../../schema/policy.js';

export type UpdatePolicyOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPolicy<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing policies.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the policies objects for the updated policies.
 * @throws Will throw if keys is empty
 */
export const updatePolicies =
	<Schema, const TQuery extends Query<Schema, DirectusPolicy<Schema>>>(
		keys: DirectusPolicy<Schema>['id'][],
		item: NestedPartial<DirectusPolicy<Schema>>,
		query?: TQuery,
	): RestCommand<UpdatePolicyOutput<Schema, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(keys, 'Keys cannot be empty');

		return {
			path: `/policies`,
			params: query ?? {},
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};

/**
 * Update multiple policies as batch.
 * @param items
 * @param query
 * @returns Returns the policies object for the updated policies.
 */
export const updatePoliciesBatch =
	<Schema, const TQuery extends Query<Schema, DirectusPolicy<Schema>>>(
		items: NestedPartial<DirectusPolicy<Schema>>[],
		query?: TQuery,
	): RestCommand<UpdatePolicyOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/policies`,
		params: query ?? {},
		body: JSON.stringify(items),
		method: 'PATCH',
	});

/**
 * Update an existing policy.
 * @param key
 * @param item
 * @param query
 * @returns Returns the policy object for the updated policy.
 * @throws Will throw if key is empty
 */
export const updatePolicy =
	<Schema, const TQuery extends Query<Schema, DirectusPolicy<Schema>>>(
		key: DirectusPolicy<Schema>['id'],
		item: NestedPartial<DirectusPolicy<Schema>>,
		query?: TQuery,
	): RestCommand<UpdatePolicyOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/policies/${key}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};
