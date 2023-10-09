import type { AbstractQueryNodeSortTargets } from '@directus/data';

export interface AbstractSqlQueryOrderNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
}
