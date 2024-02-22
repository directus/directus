import { tableIndexToIdentifier, type SqlConditionSetNumberNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsNumber } from '../json-path.js';

export const setNumberCondition = (condition: SqlConditionSetNumberNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const jsonPath = condition.target.type === 'json' ? applyJsonPathAsNumber(column, condition.target.path) : null;

	const target = jsonPath ? jsonPath : column;

	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');

	return `${target} ${negate ? 'NOT ' : ''}IN (${compareValues})`;
};
