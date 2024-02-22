import { convertNumericOperators, tableIndexToIdentifier, type SqlConditionNumberNode } from '@directus/data-sql';
import { applyFunction } from '../functions.js';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsNumber } from '../json-path.js';

export const numberCondition = (conditionNode: SqlConditionNumberNode, negate: boolean): string => {
	const target = conditionNode.target;
	const tableAlias = tableIndexToIdentifier(target.tableIndex);

	let firstOperand;

	if (target.type === 'fn') {
		firstOperand = applyFunction(target);
	} else {
		firstOperand = wrapColumn(tableAlias, target.columnName);

		if (conditionNode.target.type === 'json') {
			firstOperand = applyJsonPathAsNumber(firstOperand, conditionNode.target.path);
		}
	}

	const compareValue = `$${conditionNode.compareTo.parameterIndex + 1}`;
	const operation = convertNumericOperators(conditionNode.operation, negate);

	return `${firstOperand} ${operation} ${compareValue}`;
};
