import type { AbstractSqlQueryNode } from '../../../index.js';
import type { AbstractSqlQuerySelectNode } from '../../../nodes/index.js';

export interface SqlConditionFieldNode extends AbstractSqlQueryNode {
	type: 'condition-field';
	operation: 'eq';
	target: AbstractSqlQuerySelectNode;
	compareTo: AbstractSqlQuerySelectNode;
}
