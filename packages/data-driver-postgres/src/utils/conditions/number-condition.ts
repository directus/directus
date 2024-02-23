import { convertNumericOperators, tableIndexToIdentifier, type SqlConditionNumberNode } from '@directus/data-sql';
import { applyFunction } from '../functions.js';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathAsNumber } from '../json-path.js';

export const numberCondition = (conditionNode: SqlConditionNumberNode, negate: boolean): string => {
	const tableAlias = tableIndexToIdentifier(conditionNode.target.tableIndex);

	const column = wrapColumn(tableAlias, conditionNode.target.columnName);
	const operator = convertNumericOperators(conditionNode.operation, negate);
	const compareValue = `$${conditionNode.compareTo.parameterIndex + 1}`;

	if (conditionNode.target.type === 'primitive') {
		return `${column} ${operator} ${compareValue}`;
	} else if (conditionNode.target.type === 'json') {
		const jsonPath = applyJsonPathAsNumber(column, conditionNode.target.path);

		return `${jsonPath} ${operator} ${compareValue}`;
	} else {
		const fn = applyFunction(conditionNode.target);

		return `${fn} ${operator} ${compareValue}`;
	}
};
