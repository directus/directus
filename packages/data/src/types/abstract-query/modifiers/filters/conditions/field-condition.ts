import type { AbstractQueryFieldNodePrimitive } from '../../../fields/primitive.js';

/**
 * It's mainly used to compare two fields for relational queries.
 * That's why only the qe comparator is valid.
 */
export interface ConditionFieldNode {
	type: 'condition-field';
	target: AbstractQueryFieldNodePrimitive;
	operation: 'eq';
	compareTo: AbstractQueryFieldNodePrimitive & { collection: string };
}
