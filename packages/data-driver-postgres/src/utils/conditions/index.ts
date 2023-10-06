import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { numberCondition } from './number-condition.js';
import { stringCondition } from './string-condition.js';
import { geoCondition } from './geo-condition.js';
import { setCondition } from './set-condition.js';
import { fieldCondition } from './field-condition.js';

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
	switch (conditionNode.condition.type) {
		case 'condition-number':
			return numberCondition(conditionNode.condition, conditionNode.negate);
		case 'condition-string':
			return stringCondition(conditionNode.condition, conditionNode.negate);
		case 'condition-geo':
			return geoCondition(conditionNode.condition);
		case 'condition-set':
			return setCondition(conditionNode.condition, conditionNode.negate);
		case 'condition-field':
			return fieldCondition(conditionNode.condition, conditionNode.negate);
	}
}

/**
 * Creates a condition with a logical operator like AND or OR, as well as the negation.
 * @param logicalNode a logical wrapper which holds the logical operator and the conditions
 * @returns a nested condition
 */
function applyLogicalCondition(logicalNode: AbstractSqlQueryLogicalNode) {
	const logicalGroup = logicalNode.childNodes
		.map((childNode) => {
			if (childNode.type === 'condition' || childNode.negate) {
				return conditionString(childNode);
			}

			return `(${conditionString(childNode)})`;
		})
		.join(logicalNode.operator === 'and' ? ' AND ' : ' OR ');

	return logicalNode.negate ? `NOT (${logicalGroup})` : logicalGroup;
}
