import type { AbstractQueryNodeSort } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQueryOrderNode, AbstractSqlQuerySelectNode } from '../../types/index.js';
import { convertTarget } from './filter/conditions/utils.js';

export type SortConversionResult = {
	clauses: Required<Pick<AbstractSqlClauses, 'order' | 'joins'>>;
};

/**
 * @param abstractSorts
 * @returns the converted sort nodes
 */
export const convertSort = (
	abstractSorts: AbstractQueryNodeSort[],
	collection: string,
	idxGenerator: Generator<number, number, number>
): SortConversionResult => {
	const result: SortConversionResult = {
		clauses: {
			joins: [],
			order: [],
		},
	};

	abstractSorts.forEach((abstractSort) => {
		if (abstractSort.target.type === 'fn') {
			throw new Error('Sorting by function is not supported');
		}

		const targetConversionResult = convertTarget(abstractSort.target, collection, idxGenerator);

		const orderBy: AbstractSqlQueryOrderNode = {
			type: 'order',
			orderBy: targetConversionResult.value as AbstractSqlQuerySelectNode,
			direction: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};

		result.clauses.order.push(orderBy);
		result.clauses.joins.push(...targetConversionResult.joins);

		return result;
	});

	return result;
};
