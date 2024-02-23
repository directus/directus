import { tableIndexToIdentifier, type SqlConditionStringNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsString } from '../json-path.js';

export const stringCondition = (condition: SqlConditionStringNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const operator = getOperator(condition, negate);
	const compareValue = getCompareValue(condition);

	if (condition.target.type === 'primitive') {
		return `${column} ${operator} ${compareValue}`;
	} else if (condition.target.type === 'json') {
		const jsonPath = applyJsonPathAsString(column, condition.target.path);

		return `${jsonPath} ${operator} ${compareValue}`;
	} else {
		throw new Error('Not supported!');
	}
};

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
