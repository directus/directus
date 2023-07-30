import type { AbstractQueryNode } from '../../abstract-query.js';
import type { AbstractQueryFilterNode } from './filter.js';

/**
 * Specifies that the wrapper filter should be negated.
 */
export interface AbstractQueryNodeNegate extends AbstractQueryNode {
	type: 'negate';

	/** the values for the operation. */
	childNode: AbstractQueryFilterNode;
}
