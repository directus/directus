import type { AbstractSqlQueryNode } from '../abstract-sql-query.js';
import type { AbstractSqlQuerySelectNode } from './primitive.js';
import type { ValuesNode } from '../parameterized-statement.js';
import type { SupportedFunctions } from '@directus/data';

export interface AbstractSqlQueryFnNode extends AbstractSqlQueryNode {
	type: 'fn';

	fn: SupportedFunctions;

	field: AbstractSqlQuerySelectNode;

	isTimestampType?: boolean;

	/* Indexes of additional arguments within the parameter list  */
	arguments?: ValuesNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}
