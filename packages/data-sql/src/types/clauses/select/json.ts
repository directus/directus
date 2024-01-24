export interface AbstractSqlQuerySelectJsonNode {
	type: 'json';
	tableIndex: number;
	columnIndex: number;

	/**
	 * The path to the JSON attribute.
	 *
	 * ['author', 'name', 'first']
	 * ['author', 'age']
	 */
	path: string[][];
}
