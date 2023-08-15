import type { AbstractSqlQueryNode } from '../../../index.js';
import type { AbstractSqlQuerySelectNode } from '../../../nodes/index.js';

/**
 * Condition to filter rows where two columns of different tables are equal.
 * Mainly used for JOINs.
 */
export interface SqlConditionFieldNode extends AbstractSqlQueryNode {
	type: 'condition-field';
	operation: 'eq';
	target: AbstractSqlQuerySelectNode;
	compareTo: AbstractSqlQuerySelectNode;
}
