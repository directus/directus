export interface AbstractSqlQueryJsonNode {
	type: 'json';
	tableIndex: number;
	columnName: string;

	/* The index of the value in the list of parameter */
	path: number[];
}
