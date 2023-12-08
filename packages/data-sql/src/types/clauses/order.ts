import type { AbstractSqlQueryTargetNode } from './common/target.js';

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractSqlQueryTargetNode;
	direction: 'ASC' | 'DESC';
}
