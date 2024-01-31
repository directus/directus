import type { AbstractQueryPrimitive } from '../common/primitive.js';

/**
 * Generic primitive value read from the store field
 *
 * @example
 * Let's say you want the engine to only return the `id` field of the collection in question:
 * For that you would create a node like the following and add it to the `nodes` of the query.
 * ```
 * const primitiveField: AbstractQueryFieldNodePrimitive = {
 * 	type: 'primitive',
 * 	field: 'attribute_xy'
 * }
 * ```
 */
export interface AbstractQueryFieldNodePrimitive extends AbstractQueryPrimitive {
	alias: string;
}
