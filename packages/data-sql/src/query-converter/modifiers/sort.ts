import type { AbstractQueryNodeSort, AtLeastOneElement } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQueryOrderNode } from '../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';
import { convertTarget } from './target.js';

export type SortConversionResult = {
	clauses: Required<Pick<AbstractSqlClauses, 'order' | 'joins'>>;
};

/**
 * @param abstractSorts
 * @returns the converted sort nodes
 */
export const convertSort = (
	abstractSorts: AtLeastOneElement<AbstractQueryNodeSort>,
	collection: string,
	indexGen: IndexGenerators,
): SortConversionResult => {
	const result: SortConversionResult = {
		clauses: {
			joins: [],
			order: [],
		},
	};

	abstractSorts.forEach((abstractSort) => {
		const targetConversionResult = convertTarget(abstractSort.target, collection, indexGen);

		const orderBy: AbstractSqlQueryOrderNode = {
			type: 'order',
			orderBy: targetConversionResult.value,
			direction: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};

		result.clauses.order.push(orderBy);
		result.clauses.joins.push(...targetConversionResult.joins);

		return result;
	});

	return result;
};
