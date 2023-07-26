import type { AbstractSqlQueryFnNode } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';

/**
 * Applies an EXTRACT function to a column.
 * The extract functions needs two parameters
 * - the field to extract from
 * - the source - which can be TIMESTAMP or INTERVAL. Here we only use/support TIMESTAMP.
 *
 *  The result of a function is a number!
 *
 * @todo Check datatype of the column. If timestamp then add "AT TIME ZONE 'UTC'" to the result string
 *
 * @param fnNode - The function to use
 * @param column - The column which will be used as the argument for the function
 * @returns - EXTRACT(xy FROM ...)
 */
export const applyDataTimeFn = (fnNode: AbstractSqlQueryFnNode, wrappedColumn: string): string => {
	function applyFn(functionName: string) {
		return `EXTRACT(${functionName} FROM ${wrappedColumn}${fnNode.isTimestampType ? " AT TIME ZONE 'UTC'" : ''})`;
	}

	switch (fnNode.fn) {
		case 'year':
			return applyFn('YEAR');
		case 'month':
			return applyFn('MONTH');
		case 'week':
			return applyFn('WEEK');
		case 'day':
			return applyFn('DAY');
		case 'dow':
			return applyFn('DOW');
		case 'hour':
			return applyFn('HOUR');
		case 'minute':
			return applyFn('MINUTE');
		case 'second':
			return applyFn('SECOND');
		default:
			throw new Error(`Function ${fnNode} is not supported.`);
	}
};

export const convertCount = (fnNode: AbstractSqlQueryFnNode) => {
	const wrappedCol = wrapColumn(fnNode.field.table, fnNode.field.column);
	return `COUNT(${wrappedCol})`;
};
