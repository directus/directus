import type { DirectusField } from '../../../schema/field.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateFieldOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusField<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create a new field in the given collection.
 *
 * @param collection The collection to create a field for
 * @param item The field to create
 * @param query Optional return data query
 *
 * @returns The field object for the created field.
 */
export const createField =
	<Schema extends object, const TQuery extends Query<Schema, DirectusField<Schema>>>(
		collection: keyof Schema,
		item: NestedPartial<DirectusField<Schema>>,
		query?: TQuery,
	): RestCommand<CreateFieldOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/fields/${collection as string}`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
