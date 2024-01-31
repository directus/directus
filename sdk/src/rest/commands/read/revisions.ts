import type { DirectusRevision } from '../../../schema/revision.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadRevisionOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusRevision<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * List all Revisions that exist in Directus.
 * @param query The query parameters
 * @returns An array of up to limit Revision objects. If no items are available, data will be an empty array.
 */
export const readRevisions =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRevision<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadRevisionOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/revisions`,
		params: query ?? {},
		method: 'GET',
	});

/**
 * List an existing Revision by primary key.
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns Returns a Revision object if a valid primary key was provided.
 * @throws Will throw if key is empty
 */
export const readRevision =
	<Schema extends object, const TQuery extends Query<Schema, DirectusRevision<Schema>>>(
		key: DirectusRevision<Schema>['id'],
		query?: TQuery,
	): RestCommand<ReadRevisionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/revisions/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
