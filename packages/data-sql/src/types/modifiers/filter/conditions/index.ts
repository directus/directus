import type { SqlConditionFieldNode } from './condition-field.js';
import type { SqlConditionGeoNode } from './condition-geo.js';
import type { SqlConditionNumberNode } from './condition-number.js';
import type { SqlConditionSetNode } from './condition-set.js';
import type { SqlConditionStringNode } from './condition-string.js';

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

export * from './condition-field.js';
export * from './condition-geo.js';
export * from './condition-number.js';
export * from './condition-string.js';
export * from './condition-set.js';
