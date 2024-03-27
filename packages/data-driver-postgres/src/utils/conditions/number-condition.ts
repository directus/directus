import { convertNumericOperators, type SqlConditionNumberNode } from '@directus/data-sql';
import { convertTarget } from '../convert-target.js';

export const numberCondition = (conditionNode: SqlConditionNumberNode, negate: boolean): string => {
	const operator = convertNumericOperators(conditionNode.operation, negate);
	const compareValue = `$${conditionNode.compareTo.parameterIndex + 1}`;
	const target = convertTarget(conditionNode.target, 'number');

	return `${target} ${operator} ${compareValue}`;
};
