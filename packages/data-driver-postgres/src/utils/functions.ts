import type { AbstractSqlQueryFnNode } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';

/**
 * @todo Check datatype of the column. If timestamp then add "AT TIME ZONE 'UTC'" to the result string
 * @todo Probably add count support
 *
 * @param fnNode - The function to use
 * @param column - The column which will be used as the argument for the function
 * @returns - EXTRACT(xy FROM ...)
 */
export const applyDataTimeFn = (fnNode: AbstractSqlQueryFnNode, wrappedColumn: string): string => {
	function getFnString(fn: string) {
		return `EXTRACT(${fn} FROM ${wrappedColumn}${fnNode.isTimestampType ? " AT TIME ZONE 'UTC'" : ''})`;
	}

	switch (fnNode.fn) {
		case 'year':
			return getFnString('YEAR');
		case 'month':
			return getFnString('MONTH');
		case 'week':
			return getFnString('WEEK');
		case 'day':
			return getFnString('DAY');
		case 'dow':
			return getFnString('DOW');
		case 'hour':
			return getFnString('HOUR');
		case 'minute':
			return getFnString('MINUTE');
		case 'second':
			return getFnString('SECOND');
		default:
			throw new Error(`Function ${fnNode} is not supported.`);
	}
};

export const convertCount = (fnNode: AbstractSqlQueryFnNode) => {
	const wrappedCol = wrapColumn(fnNode.field.table, fnNode.field.column);
	return `COUNT(${wrappedCol})`;
};
