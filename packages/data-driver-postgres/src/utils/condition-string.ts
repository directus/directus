import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { getComparison } from '../utils/get-comparison.js';
import { wrapColumn } from '../utils/wrap-column.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		const target = wrapColumn(where.target.table, where.target.column);

		const comparison = getComparison(where.operation, where.compareTo, where.negate);

		return `${target} ${comparison}`;
	} else {
		const logicalGroup = where.childNodes
			.map((childNode) =>
				childNode.type === 'condition' || childNode.negate
					? conditionString(childNode)
					: `(${conditionString(childNode)})`
			)
			.join(where.operator === 'and' ? ' AND ' : ' OR ');

		return where.negate ? `NOT (${logicalGroup})` : logicalGroup;
	}
};
