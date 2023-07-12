import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { convertDateTimeFn } from './functions.js';
import { wrapColumn } from './wrap-column.js';
import { constructSqlQuery } from '../query/index.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		const target = where.condition.target;

		if (where.condition.type === 'number-condition') {
			const compareValue = `$${where.condition.compareTo.parameterIndex + 1}`;
			const operation = convertClassicOperations(where.condition.operation, where.negate);

			if (target.type === 'fn') {
				const wrappedColumn = wrapColumn(target.field.table, target.field.column);
				return `${convertDateTimeFn(target, wrappedColumn)} ${operation} ${compareValue}`;
			}

			const wrappedColumn = wrapColumn(target.table, target.column);

			return `${wrappedColumn} ${operation} ${compareValue}`;
		}

		if (where.condition.type === 'letter-condition') {
			// TODO: support functions comparison here if needed

			const wrappedColumn = wrapColumn(target.table, target.column);
			const compareValue = `$${where.condition.compareTo.parameterIndex + 1}`;

			if (where.condition.operation === 'eq') {
				return `${wrappedColumn} ${where.negate ? '!=' : '='} ${compareValue}`;
			}

			let likeValue = '';

			switch (where.condition.operation) {
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

		if (where.condition.type === 'geo-condition') {
			const wrappedColumn = wrapColumn(target.table, target.column);
			const compareValue = `$${where.condition.compareTo.parameterIndex + 1}`;

			switch (where.condition.operation) {
				case 'intersects':
					// PostGIS Manual: http://www.postgis.net/docs/ST_Intersects.html
					return `ST_Intersects(${wrappedColumn}, ${compareValue})`;
				case 'intersects_bbox':
					// https://postgis.net/docs/geometry_overlaps.html
					return `${wrappedColumn} && ${compareValue})`;
			}
		}

		if (where.condition.type === 'set-condition') {
			const wrappedColumn = wrapColumn(target.table, target.column);

			let mappedOperation = '';

			if (where.condition.operation === 'in') {
				mappedOperation = 'IN';
			} else {
				mappedOperation = convertClassicOperations(where.condition.operation, where.negate);
			}

			if (where.condition.compareTo.type === 'query') {
				const subQuery = constructSqlQuery(where.condition.compareTo);
				return `${wrappedColumn} ${mappedOperation} (${subQuery.statement})`;
			}

			if (where.condition.compareTo.type === 'values') {
				const compareValues = where.condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');
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
		throw new Error(`Unsupported where node type`);
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
