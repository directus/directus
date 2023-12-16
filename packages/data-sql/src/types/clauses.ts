import type { AbstractSqlQueryJoinNode } from './clauses/join.js';
import type { AbstractSqlQueryOrderNode } from './clauses/order.js';
import type { AbstractSqlQuerySelectNode } from './clauses/select.js';
import type { AbstractSqlQueryWhereNode } from './clauses/where.js';
import type { ValueNode } from './parameterized-statement.js';

export interface AbstractSqlClauses {
	select: AbstractSqlQuerySelectNode[];
	from: string;
	joins?: AbstractSqlQueryJoinNode[];
	where?: AbstractSqlQueryWhereNode;
	limit?: ValueNode;
	offset?: ValueNode;
	order?: AbstractSqlQueryOrderNode[];
}
