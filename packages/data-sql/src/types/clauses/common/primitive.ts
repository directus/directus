export interface AbstractSqlQueryPrimitiveNode {
	type: 'primitive';

	table: string;
	column: string;
}
