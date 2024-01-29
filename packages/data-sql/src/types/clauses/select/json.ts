export interface AbstractSqlQuerySelectJsonNode {
	type: 'json';
	tableIndex: number;
	columnName: string;
	columnIndex: number;
	path: string[];
}
