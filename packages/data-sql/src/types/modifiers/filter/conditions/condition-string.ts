import type { AbstractSqlQueryNode, AbstractSqlQuerySelectNode, ValueNode } from '../../../index.js';

export interface SqlConditionStringNode extends AbstractSqlQueryNode {
	type: 'condition-string';
	target: AbstractSqlQuerySelectNode;
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq';
	compareTo: ValueNode;
}
