interface AbstractSqlOrderPrimitive {
	type: 'primitive';
	field: string;
}

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractSqlOrderPrimitive;
	direction: 'ASC' | 'DESC';
}
