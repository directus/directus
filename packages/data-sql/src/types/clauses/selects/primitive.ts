export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

/**
 * Used to select a specific column from a table.
 */
export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn {
	type: 'primitive';

	/*
	 * A random value used as an temporarily alias to query the databases.
	 * If a function is applied, than the tmp alias will be set to that node.
	 */
	as?: string;

	/**
	 * The final alias optionally provided by the user which will be returned within the response.
	 */
	alias?: string;
}
