import type { SqlConditionSetNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';

export const setCondition = (condition: SqlConditionSetNode, negate: boolean): string => {
	const column = wrapColumn(condition.target.table, condition.target.column);
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');

	if (negate) {
		return `${column} NOT IN (${compareValues})`;
	}

	return `${column} IN (${compareValues})`;
};
