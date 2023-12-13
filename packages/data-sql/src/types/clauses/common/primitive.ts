export interface AbstractSqlQueryPrimitiveNode {
	type: 'primitive';

	tableIndex: number;
	columnName: string;
}
