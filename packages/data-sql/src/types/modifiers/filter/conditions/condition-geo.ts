import type { AbstractSqlQueryNode, ValueNode } from '../../../index.js';
import type { AbstractSqlQuerySelectNode } from '../../../nodes/index.js';

export interface SqlConditionGeoNode extends AbstractSqlQueryNode {
	type: 'condition-geo';
	target: AbstractSqlQuerySelectNode;
	operation: 'intersects' | 'intersects_bbox';
	compareTo: ValueNode;
}
