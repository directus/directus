import { type SqlConditionSetStringNode } from '@directus/data-sql';
import { convertTarget } from '../convert-target.js';

export const setStringCondition = (condition: SqlConditionSetStringNode, negate: boolean): string => {
	const operator = negate ? 'NOT IN' : 'IN';
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');
	const target = convertTarget(condition.target);

	return `${target} ${operator} (${compareValues})`;
};
