import type { SqlConditionFieldNode } from './condition-field.js';
import type { SqlConditionGeoNode } from './condition-geo.js';
import type { SqlConditionNumberNode } from './condition-number.js';
import type { SqlConditionSetNode } from './condition-set.js';
import type { SqlConditionStringNode } from './condition-string.js';

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
	| 'condition-letter'
	| 'condition-number'
	| 'condition-geo'
	| 'condition-set'
	| 'condition-field';
