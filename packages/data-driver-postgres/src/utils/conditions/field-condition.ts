import { convertNumericOperators, type SqlConditionFieldNode } from '@directus/data-sql';
import { tableIndexToIdentifier } from '../index-to-identifier.js';
import { wrapColumn } from '../wrap-column.js';

/**
 * This is mainly used for JOIN conditions.
 * @param condition
 * @param negate
 * @returns col1 = col2
 */
export const fieldCondition = (condition: SqlConditionFieldNode, negate: boolean): string => {
	const tableAlias1 = tableIndexToIdentifier(condition.target.tableIndex);
	const tableAlias2 = tableIndexToIdentifier(condition.compareTo.tableIndex);

	const column1 = wrapColumn(tableAlias1, condition.target.columnName);
	const column2 = wrapColumn(tableAlias2, condition.compareTo.columnName);
	const operation = convertNumericOperators(condition.operation, negate);
	return `${column1} ${operation} ${column2}`;
};
