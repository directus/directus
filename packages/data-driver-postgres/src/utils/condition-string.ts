import {
	convertNumericOperators,
	type AbstractSqlQueryConditionNode,
	type AbstractSqlQueryLogicalNode,
} from '@directus/data-sql';
import { applyDataTimeFn } from './functions.js';
import { wrapColumn } from './wrap-column.js';

/**
 * Create a condition string with optional negation or nesting.
 * It's used by the where and the join clause.
 * @param node the condition node or logical wrapper node
 * @returns the whole condition string included nested conditions
 */
export const conditionString = (node: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (node.type === 'logical') {
		return applyLogicalCondition(node);
	}

	return getCondition(node);
};

/**
 * Gets a single condition without logical operators.
 * @param conditionNode
 * @returns a single condition
 */
function getCondition(conditionNode: AbstractSqlQueryConditionNode) {
	if (conditionNode.condition.type === 'condition-number') {
		const target = conditionNode.condition.target;
		let firstOperand;

		if (target.type === 'fn') {
			const wrappedColumn = wrapColumn(target.field.table, target.field.column);
			firstOperand = applyDataTimeFn(target, wrappedColumn);
		} else {
			firstOperand = wrapColumn(target.table, target.column);
		}

		const compareValue = `$${conditionNode.condition.compareTo.parameterIndex + 1}`;
		const operation = convertNumericOperators(conditionNode.condition.operation, conditionNode.negate);

		return `${firstOperand} ${operation} ${compareValue}`;
	}

	if (conditionNode.condition.type === 'condition-letter') {
		// TODO: support functions comparison here if needed

		const column = wrapColumn(conditionNode.condition.target.table, conditionNode.condition.target.column);
		const compareValue = `$${conditionNode.condition.compareTo.parameterIndex + 1}`;

		if (conditionNode.condition.operation === 'eq') {
			return `${column} ${conditionNode.negate ? '!=' : '='} ${compareValue}`;
		}

		let likeValue = '';

		switch (conditionNode.condition.operation) {
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

		return `${column} ${conditionNode.negate ? 'NOT LIKE' : 'LIKE'} ${likeValue}`;
	}

	if (conditionNode.condition.type === 'condition-geo') {
		const column = wrapColumn(conditionNode.condition.target.table, conditionNode.condition.target.column);
		const parameterIndex = conditionNode.condition.compareTo.parameterIndex;

		// the arguments to the intersect functions need to be in specific 'geometry' object
		// therefore it needs to be converted using another PostGis function
		// https://postgis.net/docs/ST_GeomFromText.html
		const geomConvertedText = `ST_GeomFromText($${parameterIndex + 1})`;

		switch (conditionNode.condition.operation) {
			case 'intersects':
				// PostGIS Manual: http://www.postgis.net/docs/ST_Intersects.html
				return `ST_Intersects(${column}, ${geomConvertedText})`;
			case 'intersects_bbox':
				// https://postgis.net/docs/geometry_overlaps.html
				return `${column} && ${geomConvertedText})`;
		}
	}

	if (conditionNode.condition.type === 'condition-set') {
		const column = wrapColumn(conditionNode.condition.target.table, conditionNode.condition.target.column);
		const compareValues = conditionNode.condition.compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ');
		return `${column} ${conditionNode.condition.operation.toUpperCase()} (${compareValues})`;
	}

	if (conditionNode.condition.type === 'field-condition') {
		const column1 = wrapColumn(conditionNode.condition.target.table, conditionNode.condition.target.column);
		const column2 = wrapColumn(conditionNode.condition.compareTo.table, conditionNode.condition.compareTo.column);
		const operation = convertNumericOperators(conditionNode.condition.operation, conditionNode.negate);
		return `${column1} ${operation} ${column2}`;
	}

	throw new Error(`Unsupported condition type.`);
}

/**
 * Creates a condition with a logical operator like AND or OR, as well as the negation.
 * @param logicalNode a logical wrapper which holds the logical operator and the conditions
 * @returns a nested condition
 */
function applyLogicalCondition(logicalNode: AbstractSqlQueryLogicalNode) {
	const logicalGroup = logicalNode.childNodes
		.map((childNode) =>
			childNode.type.startsWith('condition') || childNode.negate
				? conditionString(childNode)
				: `(${conditionString(childNode)})`
		)
		.join(logicalNode.operator === 'and' ? ' AND ' : ' OR ');

	return logicalNode.negate ? `NOT (${logicalGroup})` : logicalGroup;
}
