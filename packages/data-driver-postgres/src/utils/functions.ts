import type { AbstractSqlQueryFnNode } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';

/**
 * Wraps a column with a function.
 *
 * @param fnNode - The function node which holds the function name and the column
 * @returns	Basically FN("table"."column")
 */
export function applyFunction(fnNode: AbstractSqlQueryFnNode) {
	const wrappedColumn = wrapColumn(fnNode.field.table, fnNode.field.column);

	if (fnNode.fn === 'count') {
		return convertCount(wrappedColumn);
	} else {
		return applyDataTimeFn(fnNode, wrappedColumn);
	}
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
export const applyDataTimeFn = (fnNode: AbstractSqlQueryFnNode, col: string): string => {
	function applyFn(functionName: string) {
		return `EXTRACT(${functionName} FROM ${col}${fnNode.isTimestampType ? " AT TIME ZONE 'UTC'" : ''})`;
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

/**
 * Applies a COUNT function to the column.
 *
 * @param col
 * @returns COUNT("table"."column")
 */
export const convertCount = (col: string) => {
	return `COUNT(${col})`;
};
