import type { AtLeastOneElement } from '@directus/data';
import type { AbstractSqlQueryConditionNode } from './condition.js';

/**
 * A wrapper to add multiple conditions at once.
 */
export interface AbstractSqlQueryLogicalNode {
	type: 'logical';

	/* The logical operator to use to group the conditions. */
	operator: 'and' | 'or';

	/* Specifies of the condition should be negated or not. */
	negate: boolean;

	/* A list of conditions or a nested group with another operator. */
	childNodes: AtLeastOneElement<AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode>;
}
