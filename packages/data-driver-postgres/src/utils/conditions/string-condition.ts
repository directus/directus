import { tableIndexToIdentifier, type SqlConditionStringNode } from '@directus/data-sql';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathIfNeeded } from '../json-path.js';

export const stringCondition = (condition: SqlConditionStringNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);

	let target = wrapColumn(tableAlias, condition.target.columnName);
	target = applyJsonPathIfNeeded(condition.target, target);

	const compareValue = `$${condition.compareTo.parameterIndex + 1}`;

	if (condition.operation === 'eq') {
		return `${target} ${negate ? '!=' : '='} ${compareValue}`;
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

	return `${target} ${negate ? 'NOT LIKE' : 'LIKE'} ${likeValue}`;
};
