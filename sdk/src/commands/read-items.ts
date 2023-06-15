import type { Query, RESTCommand } from '../types/index.js';

export type GetItem<Schema extends object, TName extends keyof Schema> = TName extends keyof Schema
	? Schema[TName]
	: never;

export interface ReadItemsInput<Item extends object> {
	query?: Query<Item>;
}

// export type ReadItemsOutput<
// 	Schema extends object,
// 	Input extends ReadItemsInput<Schema>
// > = Schema[Input['collection']][];

export const readItems =
	<Schema extends object, Collection extends keyof Schema, Item extends Schema[Collection]>(
		collection: Collection,
		query: Query<Item> = {}
	): RESTCommand<Query<Item>, Item[], Schema> =>
	() => {
		const _collection = String(collection);
		return {
			path: _collection.startsWith('directus_') ? `/${_collection.slice(9)}` : `/items/${_collection}`,
			params: query,
			method: 'GET',
		};
	};
