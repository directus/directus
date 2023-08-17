import type { AbstractSqlQueryFnNode, AbstractSqlQueryJoinNode } from './nodes/index.js';
import type { AbstractSqlQuerySelectNode } from './nodes/primitive.js';
import type { ValueNode, ParameterTypes } from './parameterized-statement.js';
import type { AbstractSqlQueryOrderNode } from './modifiers/order.js';
import type { AbstractSqlQueryLogicalNode } from './modifiers/filter/logical.js';
import type { AbstractSqlQueryConditionNode } from './modifiers/filter/conditions/index.js';

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
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	join?: AbstractSqlQueryJoinNode[];
	limit?: ValueNode;
	offset?: ValueNode;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	parameters: ParameterTypes[];
	/**
	 * SQL returns data as a flat object. This map contains the flat property names and the JSON path
	 * they correspond to.
	 */
	paths: Map<string, string[]>;
}

export type WhereUnion = Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>>;
