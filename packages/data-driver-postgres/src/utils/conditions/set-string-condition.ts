import { tableIndexToIdentifier, type SqlConditionSetStringNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsString } from '../json-path.js';

export const setStringCondition = (condition: SqlConditionSetStringNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);

	const jsonPath = condition.target.type === 'json' ? applyJsonPathAsString(column, condition.target.path) : null;

	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');
	const firstOperand = jsonPath !== null ? jsonPath : column;

	return `${firstOperand} ${negate ? 'NOT ' : ''}IN (${compareValues})`;
};
