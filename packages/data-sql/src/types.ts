import type { AbstractQueryNodeSortTargets } from '@directus/data';

interface SqlStatementColumn {
	type: 'primitive';
	table: string;
	column: string;
}

export interface SqlStatementSelectColumn extends SqlStatementColumn {
	as?: string;
}

// export interface SqlStatementSelectFn {
// 	type: 'fn';
// 	fn: string;
// 	args: (string | number | boolean)[];
// 	table: string;
// 	column: string;
// 	as?: string;
// }

/** @TODO */
// export interface SqlStatementSelectJson {
// 	type: 'json';
// 	table: string;
// 	column: string;
// 	as?: string;
// 	path: string;
// }

/**
 * Used for parameterized queries.
 */
type ParameterIndex = {
	/** Indicates where the actual value is stored in the parameter array */
	parameterIndex: number;
};

/**
 * This is an abstract SQL query which can be passed to all SQL drivers.
 *
 * @example
 * ```ts
 * const query: SqlStatement = {
 *  select: [id],
 *  from: 'articles',
 *  limit: 0,
 * 	parameters: [25],
 * };
 * ```
 */
export interface AbstractSqlQuery {
	select: SqlStatementSelectColumn[];
	from: string;
	join?: AbstractSqlQueryJoinNode[];
	limit?: ParameterIndex;
	offset?: ParameterIndex;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryWhereConditionNode | AbstractSqlQueryWhereLogicalNode;
	parameters: (string | boolean | number)[];
	aliasMap: Map<string, string>;
}

type AbstractSqlQueryNodeType = 'order' | 'join' | 'condition' | 'logical' | 'value';

/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 * @see `AbstractQueryNodeType` for all possible types.
 */
interface AbstractSqlQueryNode {
	/** the type of the node */
	type: AbstractSqlQueryNodeType;
}

export interface AbstractSqlQueryOrderNode extends AbstractSqlQueryNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
}

export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';
	table: string;
	as?: string;
	on: AbstractSqlQueryWhereConditionNode;
}

/**
 * An abstract WHERE clause.
 */
export interface AbstractSqlQueryWhereConditionNode extends AbstractSqlQueryNode {
	type: 'condition';

	/* value which will be compared to another value or expression. Functions will be supported soon. */
	target: SqlStatementColumn;

	/* an abstract comparator */
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains' | 'starts_with' | 'ends_with' | 'intersects';

	/* indicated of the condition should be negated using NOT */
	negate: boolean;

	/* a value to which the target will be compared */
	compareTo: CompareValueNode | SqlStatementColumn;
}

export interface AbstractSqlQueryWhereLogicalNode extends AbstractSqlQueryNode {
	type: 'logical';
	operator: 'and' | 'or';
	negate: boolean;
	childNodes: (AbstractSqlQueryWhereConditionNode | AbstractSqlQueryWhereLogicalNode)[];
}

export interface CompareValueNode {
	type: 'value';
	parameterIndexes: number[];
}

/**
 * An actual vendor specific SQL statement with its parameters.
 * @example
 * ```
 * {
 * 		statement: 'SELECT * FROM "articles" WHERE "articles"."id" = $1;',
 * 		values: [99],
 * }
 * ```
 */
export interface ParameterizedSqlStatement {
	statement: string;
	parameters: (string | number | boolean)[];
}
