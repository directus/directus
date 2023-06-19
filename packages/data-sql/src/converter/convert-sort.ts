import type { AbstractQueryNodeSort } from '@directus/data';
import type { SqlOrder } from '../types.js';

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const convertSort = (abstractSorts: AbstractQueryNodeSort[]): SqlOrder[] => {
	return abstractSorts.map((abstractSort) => {
		return {
			orderBy: abstractSort.target,
			order: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};
	});
};
