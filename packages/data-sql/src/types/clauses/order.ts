import type { AbstractSqlQuerySelectNode } from "./index.js";

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractSqlQuerySelectNode;
	direction: 'ASC' | 'DESC';
}
