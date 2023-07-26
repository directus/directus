import { convertNumericOperators, type SqlConditionNumberNode } from '@directus/data-sql';
import { applyFunction } from '../functions.js';
import { wrapColumn } from '../wrap-column.js';

export const numberCondition = (conditionNode: SqlConditionNumberNode, negate: boolean): string => {
	const target = conditionNode.target;
	let firstOperand;

	if (target.type === 'fn') {
		firstOperand = applyFunction(target);
	} else {
		firstOperand = wrapColumn(target.table, target.column);
	}

	const compareValue = `$${conditionNode.compareTo.parameterIndex + 1}`;
	const operation = convertNumericOperators(conditionNode.operation, negate);

	return `${firstOperand} ${operation} ${compareValue}`;
};
