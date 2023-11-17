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
export interface ConditionStringNode<Target> {
	type: 'condition-string';

	target: Target;

	/** @TODO maybe also regex? */
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq';

	compareTo: string;
}
