import type { AbstractSqlQueryLogicalNode, AbstractSqlQueryConditionNode } from '../where/index.js';

/**
 * Used to join another table, regardless of the type of relation.
 */
export interface AbstractSqlQueryJoinNode {
	type: 'join';

	/* the foreign table to join */
	table: string;

	/*
	 * the condition used to specify the relation between the two tables.
	 * Typically foreignKey = primaryKey or vice versa. Other conditions are possible but not recommended!
	 * The usage of the existing filter types below is only for the ease of use.
	 * We reuse the filter logic to specify the join condition, and by that enable the user to specify all kinds of join conditions.
	 */
	on: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;

	/* the generated alias which will be part of the actual query */
	as: string;

	/* an alias provided by the user */
	alias?: string;
}
