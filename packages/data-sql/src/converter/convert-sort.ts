import type { AbstractQueryNodeSort } from '@directus/data';
import type { SqlStatement } from '../types.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const convertSort = (
	abstractSort: AbstractQueryNodeSort
): Required<Pick<SqlStatement, 'orderBy' | 'order' | 'parameters'>> => {
	const idGen = parameterIndexGenerator();

	const orderBy = idGen.next().value as number;
	const order = abstractSort.direction === 'ascending' ? 'ASC' : 'DESC';
	const parameters = [abstractSort.target];

	return { orderBy, order, parameters };
};
