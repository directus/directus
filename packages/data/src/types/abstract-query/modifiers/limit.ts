import type { AbstractQueryNode } from '../abstract-query.js';

/**
 * Specifies the maximum amount of returning results
 */
export interface AbstractQueryNodeLimit extends AbstractQueryNode {
	type: 'limit';
	value: number;
}
