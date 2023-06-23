import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateItemOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, Schema[Collection], TQuery['fields']>;

export const createItem =
	<
		Schema extends object,
		Collection extends keyof Schema,
		TQuery extends Query<Schema, Schema[Collection]>,
		Item = Schema[Collection]
	>(
		collection: Collection,
		items: Partial<Item>,
		query?: TQuery
	): RestCommand<CreateItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		if (_collection.startsWith('directus_')) {
			throw new Error('Cannot use readItems for core collections');
		}

		return {
			path: `/items/${_collection}`,
			params: queryToParams(query ?? {}),
			body: JSON.stringify(items),
			method: 'POST',
		};
	};
