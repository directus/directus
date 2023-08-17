import type { DirectusCollection } from '../../../schema/collection.js';
import type { ApplyQueryFields } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type ReadCollectionOutput<
	Schema extends object,
	Item extends object = DirectusCollection<Schema>
> = ApplyQueryFields<Schema, Item, '*'>;

/**
 * List the available collections.
 * @returns An array of collection objects.
 */
export const readCollections =
	<Schema extends object>(): RestCommand<ReadCollectionOutput<Schema>[], Schema> =>
	() => ({
		path: `/collections`,
		method: 'GET',
	});

/**
 * Retrieve a single collection by table name.
 * @param collection The collection name
 * @returns A collection object.
 */
export const readCollection =
	<Schema extends object>(
		collection: DirectusCollection<Schema>['collection']
	): RestCommand<ReadCollectionOutput<Schema>, Schema> =>
	() => ({
		path: `/collections/${collection}`,
		method: 'GET',
	});
