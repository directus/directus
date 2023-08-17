import type { AbstractSqlQueryNode } from '../../../utils.js';
import type { AbstractSqlQuerySelectNode } from '../../../nodes/primitive.js';

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
