import { tableIndexToIdentifier, type SqlConditionSetStringNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsString } from '../json-path.js';

export const setStringCondition = (condition: SqlConditionSetStringNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const operator = negate ? 'NOT IN' : 'IN';
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');

	if (condition.target.type === 'primitive') {
		return `${column} ${operator} (${compareValues})`;
	} else if (condition.target.type === 'json') {
		const jsonPath = applyJsonPathAsString(column, condition.target.path);

		return `${jsonPath} ${operator} (${compareValues})`;
	} else {
		throw new Error('Not supported!');
	}
};
