import type { AbstractQueryModifiers } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQuery } from '../../types/index.js';
import type { IndexGenerators } from '../utils/create-index-generators.js';
import { convertFilter } from './filter/filter.js';
import { convertSort } from './sort.js';

export type ModifierConversionResult = {
	clauses: Pick<AbstractSqlClauses, 'joins' | 'where' | 'limit' | 'offset' | 'order'>;
	parameters: AbstractSqlQuery['parameters'];
};

export const convertModifiers = (
	modifiers: AbstractQueryModifiers,
	tableIndex: number,
	indexGen: IndexGenerators,
): ModifierConversionResult => {
	const result: ModifierConversionResult = {
		clauses: {},
		parameters: [],
	};

	if (modifiers.filter) {
		const convertedFilter = convertFilter(modifiers.filter, tableIndex, indexGen);
		result.clauses.where = convertedFilter.clauses.where;

		if (convertedFilter.clauses.joins.length > 0) {
			result.clauses.joins = convertedFilter.clauses.joins;
		}

		result.parameters.push(...convertedFilter.parameters);
	}

	if (modifiers.limit) {
		result.clauses.limit = { type: 'value', parameterIndex: indexGen.parameter.next().value };
		result.parameters.push(modifiers.limit.value);
	}

	if (modifiers.offset) {
		result.clauses.offset = { type: 'value', parameterIndex: indexGen.parameter.next().value };
		result.parameters.push(modifiers.offset.value);
	}

	if (modifiers.sort) {
		const sortConversionResult = convertSort(modifiers.sort, tableIndex, indexGen);
		result.clauses.order = sortConversionResult.clauses.order;

		if (sortConversionResult.clauses.joins.length > 0) {
			if (result.clauses.joins) {
				result.clauses.joins!.push(...sortConversionResult.clauses.joins);
			} else {
				result.clauses.joins = sortConversionResult.clauses.joins;
			}
		}

		result.parameters.push(...sortConversionResult.parameters);
	}

	return result;
};
