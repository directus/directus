import {
	convertNumericOperators,
	type AbstractSqlQueryConditionNode,
	type AbstractSqlQueryLogicalNode,
} from '@directus/data-sql';
import { applyDataTimeFn } from './functions.js';
import { wrapColumn } from './wrap-column.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		if (where.condition.type === 'condition-number') {
			const target = where.condition.target;
			let firstOperand;

			if (target.type === 'fn') {
				const wrappedColumn = wrapColumn(target.field.table, target.field.column);
				firstOperand = applyDataTimeFn(target, wrappedColumn);
			} else {
				firstOperand = wrapColumn(target.table, target.column);
			}

			const compareValue = `$${where.condition.compareTo.parameterIndex + 1}`;
			const operation = convertNumericOperators(where.condition.operation, where.negate);

			return `${firstOperand} ${operation} ${compareValue}`;
		}

		if (where.condition.type === 'between-condition') {
			const column = wrapColumn(where.condition.target.table, where.condition.target.column);
			const params = where.condition.compareTo.parameterIndexes;
			const compareValue = `[$${params[0] + 1}, $${params[1] + 1}]`;
			return `${column} BETWEEN ${compareValue}`;
		}

		if (where.condition.type === 'condition-letter') {
			// TODO: support functions comparison here if needed

			const column = wrapColumn(where.condition.target.table, where.condition.target.column);
			const compareValue = `$${where.condition.compareTo.parameterIndex + 1}`;

			if (where.condition.operation === 'eq') {
				return `${column} ${where.negate ? '!=' : '='} ${compareValue}`;
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

			return `${column} ${where.negate ? 'NOT LIKE' : 'LIKE'} ${likeValue}`;
		}

		if (where.condition.type === 'condition-geo') {
			const column = wrapColumn(where.condition.target.table, where.condition.target.column);
			const parameterIndex = where.condition.compareTo.parameterIndex;

			// the arguments to the intersect functions need to be in specific 'geometry' object
			// therefore it needs to be converted using another PostGis function
			// https://postgis.net/docs/ST_GeomFromText.html
			const geomConvertedText = `ST_GeomFromText($${parameterIndex + 1})`;

			switch (where.condition.operation) {
				case 'intersects':
					// PostGIS Manual: http://www.postgis.net/docs/ST_Intersects.html
					return `ST_Intersects(${column}, ${geomConvertedText})`;
				case 'intersects_bbox':
					// https://postgis.net/docs/geometry_overlaps.html
					return `${column} && ${geomConvertedText})`;
			}
		}

		if (where.condition.type === 'condition-set') {
			const column = wrapColumn(where.condition.target.table, where.condition.target.column);
			const compareValues = where.condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');
			return `${column} ${where.condition.operation.toUpperCase()} (${compareValues})`;
		}

		if (where.condition.type === 'field-condition') {
			const column1 = wrapColumn(where.condition.target.table, where.condition.target.column);
			const column2 = wrapColumn(where.condition.compareTo.table, where.condition.compareTo.column);
			const operation = convertNumericOperators(where.condition.operation, where.negate);
			return `${column1} ${operation} ${column2}`;
		}

		throw new Error(`Unsupported condition type.`);
	}

	if (where.type === 'logical') {
		// the node is a logical node
		const logicalGroup = where.childNodes
			.map((childNode) =>
				childNode.type.endsWith('condition') || childNode.negate
					? conditionString(childNode)
					: `(${conditionString(childNode)})`
			)
			.join(where.operator === 'and' ? ' AND ' : ' OR ');

		return where.negate ? `NOT (${logicalGroup})` : logicalGroup;
	}

	throw new Error(`Unsupported where node type`);
};
