import type { AbstractQueryNodeSort } from '@directus/data';
import type { AbstractSqlOrder } from '../types.js';

/**
 * @param abstractSorts
 * @returns the converted sort nodes
 */
export const convertSort = (abstractSorts: AbstractQueryNodeSort[]): AbstractSqlOrder[] => {
	return abstractSorts.map((abstractSort) => {
		return {
			orderBy: abstractSort.target,
			direction: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};
	});
};
