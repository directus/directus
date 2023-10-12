import type { ParameterTypes, ValueNode } from '../parameterized-statement.js';
import type { AbstractSqlQueryJoinNode } from './joins/join.js';
import type { AbstractSqlQueryOrderNode } from './order.js';
import type { AbstractSqlQueryFnNode } from './selects/fn.js';
import type { AbstractSqlQuerySelectNode } from './selects/primitive.js';
import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from './where/index.js';

export interface AbstractSqlClauses {
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	joins?: AbstractSqlQueryJoinNode[];
	where?: AbstractSqlQueryWhereNode;
	limit?: ValueNode;
	offset?: ValueNode;
	order?: AbstractSqlQueryOrderNode[];
}

export type AbstractSqlQueryWhereNode = AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;

export type WhereUnion = {
	where: AbstractSqlQueryWhereNode;
	parameters: ParameterTypes[];
};

export * from './selects/fn.js';
export * from './selects/primitive.js';
export * from './joins/join.js';
export * from './where/index.js';
export * from './order.js';
