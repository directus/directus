import type { Query } from '../../../types/query.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export interface ReadItemsInput<TItem extends object> {
	query?: Query<TItem>;
}

// export type ReadItemsOutput<
// 	Schema extends object,
// 	Input extends ReadItemsInput<Schema>
// > = Schema[Input['collection']][];

export const readItems =
	<TSchema extends object, TCollection extends keyof TSchema, TItem extends TSchema[TCollection]>(
		collection: TCollection,
		query: Query<TItem> = {}
	): RestCommand<Query<TItem>, TItem[], TSchema> =>
	() => {
		const _collection = String(collection);

		return {
			path: _collection.startsWith('directus_') ? `/${_collection.slice(9)}` : `/items/${_collection}`,
			params: queryToParams(query),
			method: 'GET',
		};
	};
