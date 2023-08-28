import type { SqlConditionFieldNode } from './field-condition.js';
import type { SqlConditionGeoNode } from './geo-condition.js';
import type { SqlConditionNumberNode } from './number-condition.js';
import type { SqlConditionSetNode } from './set-condition.js';
import type { SqlConditionStringNode } from './string-condition.js';

/**
 * Condition to filter rows.
 * Various condition types are supported, each depending on a specific datatype.
 * The condition can also be negated on this level.
 */
export interface AbstractSqlQueryConditionNode {
	type: 'condition';
	condition:
		| SqlConditionStringNode
		| SqlConditionNumberNode
		| SqlConditionGeoNode
		| SqlConditionSetNode
		| SqlConditionFieldNode;
	negate: boolean;
}

export type SqlConditionType =
	| 'condition-string'
	| 'condition-number'
	| 'condition-geo'
	| 'condition-set'
	| 'condition-field';

export * from './field-condition.js';
export * from './geo-condition.js';
export * from './number-condition.js';
export * from './string-condition.js';
export * from './set-condition.js';
