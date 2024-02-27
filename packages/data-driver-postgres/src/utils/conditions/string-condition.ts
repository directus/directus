import { type SqlConditionStringNode } from '@directus/data-sql';
import { convertTarget } from '../convert-target.js';

export function stringCondition(condition: SqlConditionStringNode, negate: boolean): string {
	const operator = getOperator(condition, negate);
	const compareValue = getCompareValue(condition);
	const target = convertTarget(condition.target);

	return `${target} ${operator} ${compareValue}`;
}

function getOperator(condition: SqlConditionStringNode, negate: boolean) {
	if (condition.operation === 'eq') {
		return negate ? '!=' : '=';
	} else {
		return negate ? 'NOT LIKE' : 'LIKE';
	}
}

function getCompareValue(condition: SqlConditionStringNode) {
	const compareValue = `$${condition.compareTo.parameterIndex + 1}`;

	if (condition.operation === 'contains') {
		return `'%'||${compareValue}||'%'`;
	} else if (condition.operation === 'starts_with') {
		return `${compareValue}||'%'`;
	} else if (condition.operation === 'ends_with') {
		return `'%'||${compareValue}`;
	} else {
		return compareValue;
	}
}
