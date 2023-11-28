import type { AbstractSqlQueryFnNode } from './select/fn.js';
import type { AbstractSqlQuerySelectNode } from './select/primitive.js';

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	direction: 'ASC' | 'DESC';
}
