import type { AbstractSqlQueryFnNode } from '../common/function.js';

/**
 * Used to apply a function to a column.
 * Currently we support various EXTRACT functions to extract specific parts out of a data/time value.
 */
export interface AbstractSqlQuerySelectFnNode extends AbstractSqlQueryFnNode {
	as: string;
}
