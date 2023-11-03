import type { AbstractQueryNodeSort } from '@directus/data';
import type { AbstractSqlQueryOrderNode } from '../../types/index.js';

/**
 * @param abstractSorts
 * @returns the converted sort nodes
 */
export const convertSort = (abstractSorts: AbstractQueryNodeSort[]): AbstractSqlQueryOrderNode[] => {
	return abstractSorts.map((abstractSort) => {
		if (abstractSort.target.type !== 'primitive') {
			throw new Error('Sorting on fields other than primitive fields not yet implemented!');
		}

		return {
			type: 'order',
			orderBy: abstractSort.target,
			direction: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};
	});
};
