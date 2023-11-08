export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: {
		type: 'primitive';
		column: string;
		table: string;
	};
	direction: 'ASC' | 'DESC';
}
