import { type SqlConditionSetNumberNode } from '@directus/data-sql';
import { convertTarget } from '../convert-target.js';

export const setNumberCondition = (condition: SqlConditionSetNumberNode, negate: boolean): string => {
	const operator = negate ? 'NOT IN' : 'IN';
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');
	const target = convertTarget(condition.target, 'number');

	return `${target} ${operator} (${compareValues})`;
};
