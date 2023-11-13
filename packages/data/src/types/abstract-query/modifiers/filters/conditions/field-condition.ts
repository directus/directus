import type { AbstractQueryFieldNodeTarget } from '../../../fields.js';

/**
 * It's mainly used to compare two fields for relational queries.
 * That's why only the eq comparator is valid.
 */
export interface ConditionFieldNode {
	type: 'condition-field';
	target: AbstractQueryFieldNodeTarget;
	operation: 'eq';
	compareTo: AbstractQueryFieldNodeTarget;
}
