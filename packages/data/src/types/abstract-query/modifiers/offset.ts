import type { AbstractQueryNode } from '../abstract-query.js';

/**
 * Specifies the number of items to skip before returning results
 */
export interface AbstractQueryNodeOffset extends AbstractQueryNode {
	type: 'offset';
	value: number;
}
