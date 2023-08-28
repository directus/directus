import type { ConditionGeoIntersectsNode } from './geo-condition.js';
import type { ConditionGeoIntersectsBBoxNode } from './geo-condition-bbox.js';
import type { ConditionFieldNode } from './field-condition.js';
import type { ConditionNumberNode } from './number-condition.js';
import type { ConditionSetNode } from './set-condition.js';
import type { ConditionStringNode } from './string-condition.js';
/**
 * Used to specify a condition on a query.
 * Note: No explicit support to check for 'empty' (it's just an empty string) and null.
 *
 * @example
 * ```
 * {
 * 		type: 'condition',
 * 		condition: {...}
 * },
 * ```
 */
export interface AbstractQueryConditionNode {
	type: 'condition';
	condition: ActualConditionNodes;
}

/**
 * Possible nodes which specify the condition.
 *
 * @todo The API should make sure, that the type of the targeting column has the correct type,
 * so that f.e. a condition-string will only be applied to a column of type string.
 */
export type ActualConditionNodes =
	| ConditionStringNode
	| ConditionNumberNode
	| ConditionGeoIntersectsNode
	| ConditionGeoIntersectsBBoxNode
	| ConditionSetNode
	| ConditionFieldNode;

// Those need to be exported to be used solely in the corresponding converter
export * from './field-condition.js';
export * from './geo-condition-bbox.js';
export * from './geo-condition.js';
export * from './number-condition.js';
export * from './string-condition.js';
export * from './set-condition.js';
