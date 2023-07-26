import { convertNumericOperators, type SqlConditionFieldNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';

/**
 * This is mainly used for JOIN conditions.
 * @param condition
 * @param negate
 * @returns col1 = col2
 */
export const fieldCondition = (condition: SqlConditionFieldNode, negate: boolean): string => {
	const column1 = wrapColumn(condition.target.table, condition.target.column);
	const column2 = wrapColumn(condition.compareTo.table, condition.compareTo.column);
	const operation = convertNumericOperators(condition.operation, negate);
	return `${column1} ${operation} ${column2}`;
};
