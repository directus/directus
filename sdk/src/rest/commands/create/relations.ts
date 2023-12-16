import type { DirectusRelation } from '../../../schema/relation.js';
import type { ApplyQueryFields, NestedPartial } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateRelationOutput<
	Schema extends object,
	Item extends object = DirectusRelation<Schema>,
> = ApplyQueryFields<Schema, Item, '*'>;

/**
 * Create a new relation.
 *
 * @param item The relation to create
 * @param query Optional return data query
 *
 * @returns Returns the relation object for the created relation.
 */
export const createRelation =
	<Schema extends object>(
		item: NestedPartial<DirectusRelation<Schema>>,
	): RestCommand<CreateRelationOutput<Schema>, Schema> =>
	() => ({
		path: `/relations`,
		body: JSON.stringify(item),
		method: 'POST',
	});
