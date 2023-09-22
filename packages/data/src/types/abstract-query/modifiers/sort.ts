import type { AbstractQueryFieldNodeFn } from '../fields/function.js';
import type { AbstractQueryFieldNodePrimitive } from '../fields/primitive.js';

/**
 * Specifies the order of the result, f.e. for a primitive field.
 * @example
 * ```js
 * const sortNode = {
 * 		type: 'sort',
 * 		direction: 'ascending',
 * 		target: {
 * 			type: 'primitive',
 * 			field: 'attribute_xy'
 * 		}
 * }
 * ```
 * Alternatively a function can be applied a the field.
 * The result is then used for sorting.
 * @example
 * ```js
 * const sortNode = {
 * 		type: 'sort',
 * 		direction: 'ascending',
 * 		target: {
 * 			type: 'fn',
 * 			fn: 'year',
 * 			targetNode: {
 * 				type: 'primitive'
 * 				field: 'date_created'
 * 		}
 * }
 */
export interface AbstractQueryNodeSort {
	type: 'sort';

	/** the desired order */
	direction: 'ascending' | 'descending';

	/** the node on which the sorting should be applied */
	target: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;
}

export type AbstractQueryNodeSortTargets = AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;
/**  @TODO support when working on relations */
// | AbstractQueryFieldNodeRelatedManyToOne
// | AbstractQueryFieldNodeRelatedAnyToOne;
