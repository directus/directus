import type { AbstractSqlQueryNode } from '../abstract-sql-query.js';
import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '../index.js';

export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';
	table: string;
	on: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	as: string;
}
