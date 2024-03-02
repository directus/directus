import type { AbstractQueryNodeSort, AtLeastOneElement } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQueryOrderNode } from '../../types/index.js';
import type { IndexGenerators } from '../utils/create-index-generators.js';
import { convertTarget } from './target.js';

export type SortConversionResult = {
	clauses: Required<Pick<AbstractSqlClauses, 'order' | 'joins'>>;
	parameters: string[];
};

/**
 * @param abstractSorts
 * @returns the converted sort nodes
 */
export const convertSort = (
	abstractSorts: AtLeastOneElement<AbstractQueryNodeSort>,
	tableIndex: number,
	indexGen: IndexGenerators,
): SortConversionResult => {
	const result: SortConversionResult = {
		clauses: {
			joins: [],
			order: [],
		},
		parameters: [],
	};

	abstractSorts.forEach((abstractSort) => {
		const targetConversionResult = convertTarget(abstractSort.target, tableIndex, indexGen);

		const orderBy: AbstractSqlQueryOrderNode = {
			type: 'order',
			orderBy: targetConversionResult.value,
			direction: abstractSort.direction === 'descending' ? 'DESC' : 'ASC',
		};

		result.clauses.order.push(orderBy);
		result.clauses.joins.push(...targetConversionResult.joins);
		result.parameters.push(...targetConversionResult.parameters);

		return result;
	});

	return result;
};
