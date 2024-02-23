import { tableIndexToIdentifier, type SqlConditionSetNumberNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsNumber } from '../json-path.js';

export const setNumberCondition = (condition: SqlConditionSetNumberNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const operator = negate ? 'NOT IN' : 'IN';
	const compareValues = condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');

	if (condition.target.type === 'primitive') {
		return `${column} ${operator} (${compareValues})`;
	} else if (condition.target.type === 'json') {
		const jsonPath = applyJsonPathAsNumber(column, condition.target.path);

		return `${jsonPath} ${operator} (${compareValues})`;
	} else {
		throw new Error('Not supported!');
	}
};
