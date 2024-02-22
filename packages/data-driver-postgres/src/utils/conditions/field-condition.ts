import {
	convertNumericOperators,
	tableIndexToIdentifier,
	type SqlConditionFieldNode,
	type AbstractSqlQueryTargetNode,
} from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsString } from '../json-path.js';

/**
 * This is mainly used for JOIN conditions.
 * @param condition
 * @param negate
 * @returns col1 = col2
 */
export const fieldCondition = (condition: SqlConditionFieldNode, negate: boolean): string => {
	const operant1 = getOperant(condition.target);
	const operant2 = getOperant(condition.compareTo);

	const operation = convertNumericOperators(condition.operation, negate);
	return `${operant1} ${operation} ${operant2}`;
};

function getOperant(operant: AbstractSqlQueryTargetNode) {
	const tableAlias = tableIndexToIdentifier(operant.tableIndex);
	let wrappedColumn = wrapColumn(tableAlias, operant.columnName);

	if (operant.type === 'json') {
		wrappedColumn = applyJsonPathAsString(wrappedColumn, operant.path);
	}

	return wrappedColumn;
}
