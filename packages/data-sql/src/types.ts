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
 * This is an abstract SQL query which can be passen to all SQL drivers.
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
	limit?: ParameterIndex;
	offset?: ParameterIndex;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryWhereNode;
	intersect?: AbstractSqlQuery;
	parameters: (string | boolean | number)[];
}

export type AbstractSqlQueryOrderNode = {
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
};

/**
 * An abstract WHERE clause.
 */
export interface AbstractSqlQueryWhereNode {
	type: 'condition';

	/* indicated of the condition should be negated using NOT */
	negation: boolean;

	/* value which will be compared to another value or expression. Functions will be supported soon. */
	target: SqlStatementColumn;

	/* an abstract comparator */
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'between' | 'contains' | 'starts_with' | 'ends_with';

	/* a value to which the target will be compared */
	compareTo: CompareValueNode | CompareSetNode;
}

export interface CompareValueNode {
	type: 'value';
	parameterIndexes: number[];
}

export interface CompareSetNode {
	type: 'set';
	additionalOperator?: 'all' | 'some' | 'none';
	subQuery: AbstractSqlQuery;
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
export interface ParameterizedSQLStatement {
	statement: string;
	parameters: (string | number | boolean)[];
}
