import type { AbstractSqlQueryNode } from '../abstract-sql-query.js';

export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn, AbstractSqlQueryNode {
	type: 'primitive';

	/* This should only be applied when using this node within the SELECT clause */
	as?: string;
}
