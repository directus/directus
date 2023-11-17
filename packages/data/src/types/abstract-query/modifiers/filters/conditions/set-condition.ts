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
export interface ConditionSetNode<Target> {
	type: 'condition-set';
	target: Target;
	operation: 'in';
	compareTo: (string | number)[]; // could also be an actual JS Set
}
