import type { AbstractQueryNodeSort } from '@directus/data';
import type { AbstractSqlQueryOrderNode } from '../types.js';

/**
 * @param abstractSorts
 * @returns the converted sort nodes
 */
export const convertSort = (abstractSorts: AbstractQueryNodeSort[]): AbstractSqlQueryOrderNode[] => {
	return abstractSorts.map((abstractSort) => {
		return {
			orderBy: abstractSort.target,
			direction: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};
	});
};
