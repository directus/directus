import type { SqlConditionStringNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { tableIndexToIdentifier } from '../index-to-identifier.js';

export const stringCondition = (condition: SqlConditionStringNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	const column = wrapColumn(tableAlias, condition.target.columnName);
	const compareValue = `$${condition.compareTo.parameterIndex + 1}`;

	if (condition.operation === 'eq') {
		return `${column} ${negate ? '!=' : '='} ${compareValue}`;
	}

	let likeValue = '';

	switch (condition.operation) {
		case 'contains':
			likeValue = `'%'||${compareValue}||'%'`;
			break;
		case 'starts_with':
			likeValue = `${compareValue}||'%'`;
			break;
		case 'ends_with':
			likeValue = `'%'||${compareValue}`;
			break;
	}

	return `${column} ${negate ? 'NOT LIKE' : 'LIKE'} ${likeValue}`;
};
