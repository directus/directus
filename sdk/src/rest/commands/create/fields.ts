import type { DirectusField } from '../../../schema/field.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type CreateFieldOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusField<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create a new field in the given collection.
 * @param collection The collection to create a field for
 * @param item The user to create
 * @param query Optional return data query
 * @returns
 */
export const createField =
	<Schema extends object, TQuery extends Query<Schema, DirectusField<Schema>>>(
		collection: keyof Schema,
		item: Partial<DirectusField<Schema>>,
		query?: TQuery
	): RestCommand<CreateFieldOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/fields/${collection as string}`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'POST',
	});
