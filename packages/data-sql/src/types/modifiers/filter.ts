import type { ValueNode, ValuesNode, AbstractSqlQueryNode } from '../index.js';
import type { AbstractSqlQuerySelectNode, AbstractSqlQueryFnNode } from '../nodes.js';

export interface AbstractSqlQueryConditionNode {
	type: 'condition';
	condition:
		| SqlConditionLetterNode
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

export type CompareToNodeTypes = ValueNode | AbstractSqlQuerySelectNode;

export interface AbstractSqlQueryLogicalNode extends AbstractSqlQueryNode {
	type: 'logical';
	operator: 'and' | 'or';
	negate: boolean;
	childNodes: (AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode)[];
}

export interface SqlConditionLetterNode extends AbstractSqlQueryNode {
	type: 'condition-letter';
	target: AbstractSqlQuerySelectNode;
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq';
	compareTo: ValueNode;
}

export interface SqlConditionNumberNode extends AbstractSqlQueryNode {
	type: 'condition-number';
	target: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	compareTo: ValueNode;
}

export interface SqlConditionGeoNode extends AbstractSqlQueryNode {
	type: 'condition-geo';
	target: AbstractSqlQuerySelectNode;
	operation: 'intersects' | 'intersects_bbox';
	compareTo: ValueNode;
}

export interface SqlConditionSetNode extends AbstractSqlQueryNode {
	type: 'condition-set';
	operation: 'in';
	target: AbstractSqlQuerySelectNode;
	compareTo: ValuesNode;
}

export interface SqlConditionFieldNode extends AbstractSqlQueryNode {
	type: 'condition-field';
	operation: 'eq';
	target: AbstractSqlQuerySelectNode;
	compareTo: AbstractSqlQuerySelectNode;
}
