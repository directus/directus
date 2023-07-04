import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { getComparison } from '../utils/get-comparison.js';
import { wrapColumn } from '../utils/wrap-column.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		const target = wrapColumn(where.target.table, where.target.column);

		if (where.target.type === 'primitive') {
			const comparison = getComparison(where.operation, where.compareTo, where.negate);
			return `${target} ${comparison}`;
		}

		if (where.target.type === 'fn') {
			return extractDateTime(where.target.fn, target);
		}

		throw new Error(`Unsupported target type: ${JSON.stringify(where.target)}`);
	} else {
		const logicalGroup = where.childNodes
			.map((childNode) =>
				childNode.type === 'condition' || childNode.negate
					? conditionString(childNode)
					: `(${conditionString(childNode)})`
			)
			.join(where.operator === 'and' ? ' AND ' : ' OR ');

		return where.negate ? `NOT (${logicalGroup})` : logicalGroup;
	}
};

/**
 * @todo Check datatype of the column. If timestamp then add "AT TIME ZONE 'UTC'" to the result string
 * @todo Probably add count support
 *
 * @param fn - The function to use
 * @param column - The column which will be used as the argument for the function
 * @returns - EXTRACT(xy FROM ...)
 */
export const extractDateTime = (fn: string, column: string): string => {
	function getFnString(fn: string) {
		return `EXTRACT(${fn} FROM ${column})`;
	}

	switch (fn) {
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
			throw new Error(`Function ${fn} is not supported.`);
	}
};
