import type { AbstractQueryConditionNode } from './conditions/condition.js';
import type { AbstractQueryNodeLogical } from './logical.js';

/**
 * Specifies that the wrapper filter should be negated.
 */
export interface AbstractQueryNodeNegate {
	type: 'negate';

	/** the values for the operation. */
	childNode: AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate;
}
