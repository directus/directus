import type { AbstractQueryNode } from '../abstract-query.js';
import type { AbstractQueryFieldNodeFn } from '../nodes/function.js';
import type { AbstractQueryFieldNodePrimitive } from '../nodes/primitive.js';
import type {
	AbstractQueryFieldNodeRelatedAnyToOne,
	AbstractQueryFieldNodeRelatedManyToOne,
} from '../nodes/related.js';
import type { AbstractQueryFilterNode } from './index.js';

/**
 * Optional attributes to customize the query results
 */
export interface AbstractQueryModifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort[];
	filter?: AbstractQueryFilterNode;
}

/**
 * Specifies the maximum amount of returning results
 */
interface AbstractQueryNodeLimit extends AbstractQueryNode {
	type: 'limit';
	value: number;
}

/**
 * Specifies the number of items to skip before returning results
 */
interface AbstractQueryNodeOffset extends AbstractQueryNode {
	type: 'offset';
	value: number;
}

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
export interface AbstractQueryNodeSort extends AbstractQueryNode {
	type: 'sort';

	/** the desired order */
	direction: 'ascending' | 'descending';

	/** the node on which the sorting should be applied */
	target: AbstractQueryNodeSortTargets;
}

export type AbstractQueryNodeSortTargets =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	/**  @TODO when we implement relations: */
	| AbstractQueryFieldNodeRelatedManyToOne
	| AbstractQueryFieldNodeRelatedAnyToOne;

export * from './filter.js';
