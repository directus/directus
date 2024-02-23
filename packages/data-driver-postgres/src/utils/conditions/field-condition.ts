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
	const operand1 = getOperand(condition.target);
	const operand2 = getOperand(condition.compareTo);

	const operation = convertNumericOperators(condition.operation, negate);

	return `${operand1} ${operation} ${operand2}`;
};

function getOperand(target: AbstractSqlQueryTargetNode) {
	const tableAlias = tableIndexToIdentifier(target.tableIndex);
	const wrappedColumn = wrapColumn(tableAlias, target.columnName);

	if (target.type === 'primitive') {
		return wrappedColumn;
	} else if (target.type === 'json') {
		return applyJsonPathAsString(wrappedColumn, target.path);
	} else {
		throw new Error('Not supported!');
	}
}
