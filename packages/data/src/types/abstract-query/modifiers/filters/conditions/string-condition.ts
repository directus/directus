import type { AbstractQueryFieldNodePrimitive } from '../../../abstract-query.js';

/**
 * Used to compare a string field with a string value.
 * @example
 * ```
 * {
 * 	type: 'condition-string',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'contains',
 * 	compareTo: 'someString'
 * ```
 */
export interface ConditionStringNode {
	type: 'condition-string';
	target: AbstractQueryFieldNodePrimitive; // | AbstractQueryFieldNodeFn; how do we check of the target is a valid input for the function?
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq' /** @TODO maybe regex? */;
	compareTo: string;
}
