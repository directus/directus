export interface AbstractSqlQuerySelectJsonNode {
	type: 'json';
	tableIndex: number;

	paths: Path[];
}

export interface Path {
	/**
	 * The path to the JSON attribute. Like:
	 *
	 * ['author', 'age']
	 */
	path: string[];

	columnIndex: number;
}
