import type { AbstractSqlQuerySelectFnNode } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';
import type { ExtractFn } from '@directus/data';

/**
 * Wraps a column with a function.
 *
 * @param fnNode - The function node which holds the function name and the column
 * @returns	Basically FN("table"."column")
 */
export function applyFunction(fnNode: AbstractSqlQuerySelectFnNode): string {
	const wrappedColumn = wrapColumn(fnNode.table, fnNode.column);

	if (fnNode.fn.type === 'arrayFn') {
		// count is the only array function we currently support
		return `COUNT(${wrappedColumn})`;
	}

	return applyDateTimeFn(fnNode, wrappedColumn);
}

/**
 * Applies a function to a column.
 * The EXTRACT functions which is being used for this needs two parameters:
 * - the field to extract from
 * - the source - which can be TIMESTAMP or INTERVAL. Here we only use/support TIMESTAMP.
 * The result of any of our supported functions is a number.
 *
 * @param fnNode - Specifies the function to use and the type of the target column
 * @param column - The column which will be used as the argument for the function
 * @returns - F.e. EXTRACT(YEAR FROM "table"."column")
 */
export const applyDateTimeFn = (fnNode: AbstractSqlQuerySelectFnNode, col: string): string => {
	switch (fnNode.fn.fn) {
		case 'year':
			return applyFn('YEAR', fnNode.fn);
		case 'month':
			return applyFn('MONTH', fnNode.fn);
		case 'week':
			return applyFn('WEEK', fnNode.fn);
		case 'day':
			return applyFn('DAY', fnNode.fn);
		case 'weekday':
			return applyFn('DOW', fnNode.fn);
		case 'hour':
			return applyFn('HOUR', fnNode.fn);
		case 'minute':
			return applyFn('MINUTE', fnNode.fn);
		case 'second':
			return applyFn('SECOND', fnNode.fn);
		default:
			throw new Error(`Function ${fnNode} is not supported.`);
	}

	function applyFn(functionName: string, fn: ExtractFn) {
		return `EXTRACT(${functionName} FROM ${col}${fn.isTimestampType ? " AT TIME ZONE 'UTC'" : ''})`;
	}
};
