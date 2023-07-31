import type {
	AbstractSqlQueryFnNode,
	AbstractSqlQueryNode,
	AbstractSqlQuerySelectNode,
	ValueNode,
} from '../../../index.js';

export interface SqlConditionNumberNode extends AbstractSqlQueryNode {
	type: 'condition-number';
	target: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	compareTo: ValueNode;
}
