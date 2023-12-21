import type { SqlConditionSetNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { tableIndexToIdentifier } from '../index-to-identifier.js';

export const setCondition = (condition: SqlConditionSetNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');

	if (negate) {
		return `${column} NOT IN (${compareValues})`;
	}

	return `${column} IN (${compareValues})`;
};
