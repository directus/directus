import type { AbstractSqlQueryFnNode, AbstractSqlQueryConditionNode } from '@directus/data-sql';
/**
 * @see [PostGIS Manual](http://www.postgis.net/docs/ST_Intersects.html)
 * @param whereNode - the node with all conditions
 * @param wrappedColumn - the column with its table name
 * @returns
 */
export const convertGeoFn = (whereNode: AbstractSqlQueryConditionNode, wrappedColumn: string): string => {
	if (whereNode.compareTo.type !== 'value') {
		throw new Error('Only values are supported as comparison for geo functions.');
	}

	const parameterIndex = whereNode.compareTo.parameterIndexes[0]! + 1;

	if (whereNode.operation === 'intersects') {
		return `ST_Intersects(${wrappedColumn}, $${parameterIndex})`;
	}

	throw new Error(`Function ${whereNode.operation} is currently not supported.`);
};
/**
 * @todo Check datatype of the column. If timestamp then add "AT TIME ZONE 'UTC'" to the result string
 * @todo Probably add count support
 *
 * @param fnNode - The function to use
 * @param column - The column which will be used as the argument for the function
 * @returns - EXTRACT(xy FROM ...)
 */
export const convertDateTimeFn = (fnNode: AbstractSqlQueryFnNode, wrappedColumn: string): string => {
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
