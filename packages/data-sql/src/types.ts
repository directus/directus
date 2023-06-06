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

	// limit: {
	// 	parameterIndex: number;
	// };

	// parameters: (string | boolean | number)[];
}
