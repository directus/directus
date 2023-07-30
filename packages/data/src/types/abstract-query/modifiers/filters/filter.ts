import type { AbstractQueryConditionNode } from './conditions/condition.js';
import type { AbstractQueryNodeLogical } from './logical.js';
import type { AbstractQueryNodeNegate } from './negate.js';

/**
 * All possible nodes to specify a filter on a query.
 * It can either be an actual single condition or one or two wrappers.
 * One wrapper to specify a negation, and another wrapper to specify multiple conditions using AND or OR.
 */
export type AbstractQueryFilterNode = AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate;
