import type { Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export interface ReadItemsInput<Schema extends object, Item extends object> {
	query?: Query<Schema, Item>;
}

export const readItems =
	<
		Schema extends object,
		Collection extends keyof Schema,
		Item extends Schema[Collection],
		Output extends Partial<Item>
	>(
		collection: Collection,
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
