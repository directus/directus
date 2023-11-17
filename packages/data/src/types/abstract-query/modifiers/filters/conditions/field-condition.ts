/**
 * It's mainly used to compare two fields for relational queries.
 * That's why only the eq comparator is valid.
 */
export interface ConditionFieldNode<Target> {
	type: 'condition-field';
	target: Target;
	operation: 'eq';
	compareTo: Target;
}
