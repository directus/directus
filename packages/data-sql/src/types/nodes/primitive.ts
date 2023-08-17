import type { AbstractSqlQueryNode } from '../utils.js';

export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

/**
 * Used to select a specific column from a table.
 */
export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn, AbstractSqlQueryNode {
	type: 'primitive';

	/*
	 * An alias for the column.
	 * This should only be applied when using this node within the SELECT clause.
	 */
	as?: string;
}
