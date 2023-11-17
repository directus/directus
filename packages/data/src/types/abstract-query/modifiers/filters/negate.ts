import type { AbstractQueryFilterNode } from '../filters.js';

/**
 * Specifies that the wrapper filter should be negated.
 */
export interface AbstractQueryNodeNegate<Target> {
	type: 'negate';

	/** the values for the operation. */
	childNode: AbstractQueryFilterNode<Target>;
}
