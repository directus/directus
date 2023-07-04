import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { getComparison } from '../utils/get-comparison.js';
import { wrapColumn } from '../utils/wrap-column.js';
import { extractDateTime } from './functions.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		const column = wrapColumn(where.target.table, where.target.column);
		const comparison = getComparison(where.operation, where.compareTo, where.negate);

		if (where.target.type === 'primitive') {
			return `${column} ${comparison}`;
		}

		if (where.target.type === 'fn') {
			return `${extractDateTime(where.target.fn, column)} ${comparison}`;
		}

		throw new Error(`Unsupported condition target: ${JSON.stringify(where.target)}`);
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
