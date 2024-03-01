import { convertNumericOperators, type SqlConditionFieldNode } from '@directus/data-sql';
import { convertTarget } from '../convert-target.js';

/**
 * This is mainly used for JOIN conditions.
 * @param condition
 * @param negate
 * @returns col1 = col2
 */
export const fieldCondition = (condition: SqlConditionFieldNode, negate: boolean): string => {
	const operand1 = convertTarget(condition.target);
	const operand2 = convertTarget(condition.compareTo);
	const operation = convertNumericOperators(condition.operation, negate);

	return `${operand1} ${operation} ${operand2}`;
};
