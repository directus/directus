import type { AbstractSqlQueryColumn } from './column.js';

/**
 * Used to select a specific column from a table.
 */
export interface AbstractSqlQuerySelectPrimitiveNode extends AbstractSqlQueryColumn {
	type: 'primitive';

	/*
	 * A random value used as an temporarily alias to query the databases.
	 * If a function is applied, than the tmp alias will be set to that node.
	 */
	as?: string;
}
