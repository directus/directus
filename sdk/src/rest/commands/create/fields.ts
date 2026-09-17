import type { DirectusField } from '../../../schema/field.js';
import type { ApplyQueryFields, FieldQuery, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type CreateFieldOutput<
	Schema,
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
 * @throws Will throw if collection is empty
 */
export const createField =
	<Schema, const TQuery extends FieldQuery<Schema, DirectusField<Schema>>>(
		collection: DirectusField<Schema>['collection'],
		item: NestedPartial<DirectusField<Schema>>,
		query?: TQuery,
	): RestCommand<CreateFieldOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');

		return {
			path: `/fields/${collection}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'POST',
		};
	};
