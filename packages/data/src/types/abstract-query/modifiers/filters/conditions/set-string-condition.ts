import type { AbstractQueryTarget } from '../../target.js';

/**
 * Used to compare a number field with a number value.
 * @example
 * ```
 * {
 * 	type: 'condition-set',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'in',
 * 	compareTo: [1, 2, 3]
 * ```
 */
export interface ConditionSetStringNode {
	type: 'condition-set-string';
	target: AbstractQueryTarget;
	operation: 'in';
	compareTo: string[];
}
