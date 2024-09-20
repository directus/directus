import type { DirectusPolicy } from '../../../schema/policy.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type ReadPolicyOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusPolicy<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

export type ReadPolicyGlobalsOutput = {
	app_access: boolean;
	admin_access: boolean;
	enforce_tfa: boolean;
};

/**
 * List all policies that exist in the project.
 * @param query The query parameters
 * @returns An array of up to limit Policy objects. If no items are available, data will be an empty array.
 */
export const readPolicies =
	<Schema, const TQuery extends Query<Schema, DirectusPolicy<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadPolicyOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/policies`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * Read a specific policy.
 * @param key The primary key of the permission
 * @param query The query parameters
 * @returns Returns a Policy object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readPolicy =
	<Schema, const TQuery extends Query<Schema, DirectusPolicy<Schema>>>(
		key: DirectusPolicy<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadPolicyOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/policies/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};

/**
 * Check the current user's policy globals.
 */
export const readPolicyGlobals =
	<Schema>(): RestCommand<ReadPolicyGlobalsOutput, Schema> =>
	() => ({
		path: `/policies/me/globals`,
		method: 'GET',
	});
