export interface SqlStatementSelectPrimitive {
	type: 'primitive';
	table: string;
	column: string;
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
 * This is an abstract SQL query.
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
	select: SqlStatementSelectPrimitive[];
	from: string;
	limit?: ParameterIndex;
	offset?: ParameterIndex;
	parameters: (string | boolean | number)[];
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
