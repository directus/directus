import type { AbstractQueryNodeSortTargets } from '@directus/data';
import type { AbstractSqlQueryNode } from '../utils.js';

export interface AbstractSqlQueryOrderNode extends AbstractSqlQueryNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
}
