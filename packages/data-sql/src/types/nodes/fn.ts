import type { AbstractSqlQueryNode } from '../abstract-sql-query.js';
import type { AbstractSqlQuerySelectNode } from './primitive.js';
import type { ValuesNode } from '../parameterized-statement.js';

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
