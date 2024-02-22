import { tableIndexToIdentifier, type SqlConditionSetNumberNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';

export const setNumberCondition = (condition: SqlConditionSetNumberNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');

	if (negate) {
		return `${column} NOT IN (${compareValues})`;
	}

	return `${column} IN (${compareValues})`;
};
