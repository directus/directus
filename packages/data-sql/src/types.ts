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

export interface SqlStatement {
	select: SqlStatementSelectPrimitive[];
	from: string;
	limit?: number;
	offset?: number;
	// parameters: (string | boolean | number)[];
}

/**
 * Used to work with parameterized queries.
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
	values: (string | number | boolean)[];
}
