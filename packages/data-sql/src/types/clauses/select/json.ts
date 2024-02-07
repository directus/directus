export interface AbstractSqlQuerySelectJsonNode {
	type: 'json';
	tableIndex: number;
	columnName: string;
	columnIndex: number;

	/* The index of the value in the list of parameter */
	path: number[];
}
