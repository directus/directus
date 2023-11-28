import type { AbstractQueryTarget } from '../../target.js';

/**
 * It's mainly used to compare two fields for relational queries.
 * That's why only the eq comparator is valid.
 */
export interface ConditionFieldNode {
	type: 'condition-field';
	target: AbstractQueryTarget;
	operation: 'eq';
	compareTo: AbstractQueryTarget;
}
