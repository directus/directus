import type { AbstractSqlQueryJoinNode } from './clauses/join.js';
import type { AbstractSqlQueryOrderNode } from './clauses/order.js';
import type { AbstractSqlQueryFnNode } from './clauses/select/fn.js';
import type { AbstractSqlQuerySelectNode } from './clauses/select/primitive.js';
import type { AbstractSqlQueryWhereNode } from './clauses/where.js';
import type { ValueNode } from './parameterized-statement.js';

export interface AbstractSqlClauses {
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	joins?: AbstractSqlQueryJoinNode[];
	where?: AbstractSqlQueryWhereNode;
	limit?: ValueNode;
	offset?: ValueNode;
	order?: AbstractSqlQueryOrderNode[];
}
