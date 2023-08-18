import type { AbstractQueryFieldNodeFn } from '../../../nodes/function.js';
import type { AbstractQueryFieldNodePrimitive } from '../../../nodes/primitive.js';

/**
 * Used to compare a number or date time field with a number value.
 * @example
 * ```
 * {
 * 	type: 'condition-number',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'lt',
 * 	compareTo: 5
 * ```
 */
export interface ConditionNumberNode {
	type: 'condition-number';
	target: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	compareTo: number;
}
