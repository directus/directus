import type { AbstractSqlQueryNode } from '../utils.js';
import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '../modifiers/filter/index.js';

/**
 * Used to join another table, regardless of the type of relation.
 */
export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';

	/* the foreign table to join */
	table: string;

	/*
	 * the condition used to specify the relation between the two tables.
	 * Typically foreignKey = primaryKey or vice versa. Other conditions are possible but not recommended!
	 * The usage of the existing types below is only for the ease of use.
	 */
	on: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;

	/* an alias for the table to which can be referred within the query */
	as: string;
}
