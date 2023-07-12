import type { DirectusRelation } from '../../../schema/relation.js';
import type { ApplyQueryFields } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateRelationOutput<Schema extends object, Item = DirectusRelation<Schema>> = ApplyQueryFields<
	Schema,
	Item,
	'*'
>;

/**
 * Create a new relation.
 * @param item
 * @param query
 * @returns Returns the relation object for the created relation.
 */
export const createRelation =
	<Schema extends object>(item: Partial<DirectusRelation<Schema>>): RestCommand<CreateRelationOutput<Schema>, Schema> =>
	() => ({
		path: `/relations`,
		body: JSON.stringify(item),
		method: 'POST',
	});
