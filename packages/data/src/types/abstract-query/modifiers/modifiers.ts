import type { AbstractQueryConditionNode } from './filters/conditions/condition.js';
import type { AbstractQueryNodeLogical } from './filters/logical.js';
import type { AbstractQueryNodeNegate } from './filters/negate.js';
import type { AbstractQueryNodeLimit } from './limit.js';
import type { AbstractQueryNodeOffset } from './offset.js';
import type { AbstractQueryNodeSort } from './sort.js';

/**
 * Optional attributes to customize the query results
 */
export interface AbstractQueryModifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort[];
	filter?: AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate;
}
