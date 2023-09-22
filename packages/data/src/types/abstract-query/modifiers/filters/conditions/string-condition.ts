import type { AbstractQueryFieldNodePrimitive } from '../../../fields/primitive.js';

/**
 * Used to compare a string field with a string value.
 *
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

	target: AbstractQueryFieldNodePrimitive;

	/** @TODO maybe also regex? */
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq';

	compareTo: string;
}
