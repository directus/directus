import type { AbstractSqlQueryNode, ValuesNode } from '../../../index.js';
import type { AbstractSqlQuerySelectNode } from '../../../nodes/index.js';

export interface SqlConditionSetNode extends AbstractSqlQueryNode {
	type: 'condition-set';
	operation: 'in';
	target: AbstractSqlQuerySelectNode;
	compareTo: ValuesNode;
}
