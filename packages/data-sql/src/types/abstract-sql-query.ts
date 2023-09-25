import type { AbstractSqlQueryJoinNode } from './fields/join.js';
import type { AbstractSqlQueryFnNode } from './fields/fn.js';
import type { AbstractSqlQuerySelectNode } from './fields/primitive.js';
import type { ParameterTypes, ValueNode } from './parameterized-statement.js';
import type { AbstractSqlQueryOrderNode } from './modifiers/order.js';
import type { AbstractSqlQueryLogicalNode, AbstractSqlQueryConditionNode } from './modifiers/filter/index.js';

/**
 * This is an abstract SQL query which can be passed to all SQL drivers.
 *
 * @example
 * The following query gets the title of all articles and limits the result to 25 rows.
 * ```ts
 * const query: SqlStatement = {
 *  select: [title],
 *  from: 'articles',
 *  limit: 0, // this is the index of the parameter
 * 	parameters: [25],
 * };
 * ```
 */

export interface AbstractSqlQuery {
	clauses: AbstractSqlClauses;
	parameters: ParameterTypes[];
	aliasMapping: Map<string, string[]>;
}

export interface AbstractSqlClauses {
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	joins?: AbstractSqlQueryJoinNode[];
	limit?: ValueNode;
	offset?: ValueNode;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryWhereNode;
}

export type WhereUnion = {
	where: AbstractSqlQueryWhereNode;
	parameters: ParameterTypes[];
};

export type AbstractSqlQueryWhereNode = AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;

export * from './modifiers/order.js';
export * from './modifiers/filter/index.js';
export * from './parameterized-statement.js';
export * from './fields/join.js';
export * from './fields/fn.js';
export * from './fields/primitive.js';
