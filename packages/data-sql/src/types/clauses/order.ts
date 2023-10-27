import type { AbstractQueryNodeSortTarget } from '@directus/data';

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTarget;
	direction: 'ASC' | 'DESC';
}
