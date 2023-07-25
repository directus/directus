import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from './modifiers/filter.js';
import type { ValuesNode, AbstractSqlQueryNode } from './index.js';

export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn, AbstractSqlQueryNode {
	type: 'primitive';

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

export interface AbstractSqlQueryFnNode extends AbstractSqlQueryNode {
	type: 'fn';

	/* Same as the the abstract functions @todo: add restrictions */
	fn: string;

	field: AbstractSqlQuerySelectNode;

	isTimestampType?: boolean;

	/* Indexes of additional arguments within the parameter list  */
	arguments?: ValuesNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';
	table: string;
	on: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	as: string;
}
