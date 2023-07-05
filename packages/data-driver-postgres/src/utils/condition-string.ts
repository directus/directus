import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { getComparison } from '../utils/get-comparison.js';
import { wrapColumn } from '../utils/wrap-column.js';
import { convertGeoFn, convertDateTimeFn } from './functions.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		const wrappedColumn = wrapColumn(where.target.table, where.target.column);
		const comparison = getComparison(where.operation, where.compareTo, where.negate);

		if (where.target.type === 'fn') {
			if (where.operation === 'intersects') {
				return convertGeoFn(where, wrappedColumn);
			}

			return `${convertDateTimeFn(where.target, wrappedColumn)} ${comparison}`;
		}

		return `${wrappedColumn} ${comparison}`;
	}

	// the node is a logical node
	const logicalGroup = where.childNodes
		.map((childNode) =>
			childNode.type === 'condition' || childNode.negate
				? conditionString(childNode)
				: `(${conditionString(childNode)})`
		)
		.join(where.operator === 'and' ? ' AND ' : ' OR ');

	return where.negate ? `NOT (${logicalGroup})` : logicalGroup;
};
