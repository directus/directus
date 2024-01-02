import type { AbstractSqlQuerySelectNode } from './select.js';

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractSqlQuerySelectNode;
	direction: 'ASC' | 'DESC';
}
