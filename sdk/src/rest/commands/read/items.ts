import type { Query } from '../../../types/query.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export interface ReadItemsInput<Schema extends object, Item extends object> {
	query?: Query<Schema, Item>;
}

// export type ReadItemsOutput<
// 	Schema extends object,
// 	Input extends ReadItemsInput<Schema>
// > = Schema[Input['collection']][];

export const readItems =
	<Schema extends object, TCollection extends keyof Schema, Item extends Schema[TCollection], Output extends Partial<Item>>(
		collection: TCollection,
		query: Query<Schema, Item> = {}
	): RestCommand<Query<Schema, Item>, Output[], Schema> =>
	() => {
		const _collection = String(collection);

		return {
			path: _collection.startsWith('directus_') ? `/${_collection.slice(9)}` : `/items/${_collection}`,
			params: queryToParams(query),
			method: 'GET',
		};
	};
