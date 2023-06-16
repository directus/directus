import type { Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type ReadItemsOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>
> = Partial<Schema[Collection]>;

export const readItems =
	<Schema extends object, Collection extends keyof Schema, TQuery extends Query<Schema, Schema[Collection]>>(
		collection: Collection,
		query: TQuery
	): RestCommand<ReadItemsOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		return {
			path: _collection.startsWith('directus_') ? `/${_collection.slice(9)}` : `/items/${_collection}`,
			params: queryToParams(query),
			method: 'GET',
		};
	};
