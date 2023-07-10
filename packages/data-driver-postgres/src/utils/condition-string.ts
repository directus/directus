import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { convertDateTimeFn } from './functions.js';
import { wrapColumn } from './wrap-column.js';
import { constructSqlQuery } from '../query/index.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type.endsWith('condition')) {
		where = where as AbstractSqlQueryConditionNode;

		if (where.type === 'number-condition') {
			const compareValue = `$${where.compareTo.parameterIndexes[0]! + 1}`;
			const operation = convertClassicOperations(where.operation, where.negate);

			if (where.target.type === 'fn') {
				const wrappedColumn = wrapColumn(where.target.field.table, where.target.field.column);
				return `${convertDateTimeFn(where.target, wrappedColumn)} ${operation} ${compareValue}`;
			}

			const wrappedColumn = wrapColumn(where.target.table, where.target.column);

			return `${wrappedColumn} ${operation} ${compareValue}`;
		}

		if (where.type === 'letter-condition') {
			// TODO: support functions comparison here if needed

			const wrappedColumn = wrapColumn(where.target.table, where.target.column);
			const compareValue = `$${where.compareTo.parameterIndexes[0]! + 1}`;

			if (where.operation === 'eq') {
				return `${wrappedColumn} ${where.negate ? '!=' : '='} ${compareValue}`;
			}

			let likeValue = '';

			switch (where.operation) {
				case 'contains':
					likeValue = `'%${compareValue}%'`;
					break;
				case 'starts_with':
					likeValue = `'${compareValue}%'`;
					break;
				case 'ends_with':
					likeValue = `'%${compareValue}'`;
					break;
			}

			return `${wrappedColumn} ${where.negate ? 'NOT LIKE' : 'LIKE'} ${likeValue}`;
		}

		if (where.type === 'geo-condition') {
			// PostGIS Manual: http://www.postgis.net/docs/ST_Intersects.html
			const wrappedColumn = wrapColumn(where.target.table, where.target.column);
			const compareValue = `$${where.compareTo.parameterIndexes[0]! + 1}`;

			if (where.operation === 'intersects') {
				return `ST_Intersects(${wrappedColumn}, ${compareValue})`;
			} else {
				throw new Error(`Intersects_bbox is not yet supported.`);
			}
		}

		if (where.type === 'set-condition') {
			const wrappedColumn = wrapColumn(where.target.table, where.target.column);

			let mappedOperation = '';

			if (where.operation === 'in') {
				mappedOperation = 'IN';
			} else {
				mappedOperation = convertClassicOperations(where.operation, where.negate);
			}

			if (where.compareTo.type === 'query') {
				const subQuery = constructSqlQuery(where.compareTo);
				// TODO: handle (sub) parameters
				return `${wrappedColumn} ${mappedOperation} (${subQuery.statement})`;
			}

			if (where.compareTo.type === 'values') {
				const compareValues = where.compareTo.parameterIndexes.map((index) => `$${index + 1}`).join(', ');
				return `${wrappedColumn} ${mappedOperation} (${compareValues})`;
			}
		}

		throw new Error(`Unsupported condition type.`);
	} else if (where.type === 'logical') {
		// the node is a logical node
		const logicalGroup = where.childNodes
			.map((childNode) =>
				childNode.type.endsWith('condition') || childNode.negate
					? conditionString(childNode)
					: `(${conditionString(childNode)})`
			)
			.join(where.operator === 'and' ? ' AND ' : ' OR ');

		return where.negate ? `NOT (${logicalGroup})` : logicalGroup;
	} else {
		throw new Error(`Unsupported where node type: ${where.type}`);
	}
};

function convertClassicOperations(operation: string, negate: boolean) {
	let result = '';

	switch (operation) {
		case 'eq':
			result = `${negate ? '!=' : '='}`;
			break;
		case 'gt':
			result = `${negate ? '<=' : '>'}`;
			break;
		case 'gte':
			result = `${negate ? '<' : '>='}`;
			break;
		case 'lt':
			result = `${negate ? '>=' : '<'}`;
			break;
		case 'lte':
			result = `${negate ? '>' : '<='}`;
			break;
	}

	return result;
}
