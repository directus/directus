import type { AbstractSqlQueryFnNode, AbstractSqlQuerySelectNode } from './index.js';

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	direction: 'ASC' | 'DESC';
}
