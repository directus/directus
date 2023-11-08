import type { AbstractQueryModifiers } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQuery } from '../../types/index.js';
import { convertFilter } from './filter/filter.js';
import { convertSort } from './sort.js';

export type ModifierConversionResult = {
	clauses: Pick<AbstractSqlClauses, 'joins' | 'where' | 'limit' | 'offset' | 'order'>;
	parameters: AbstractSqlQuery['parameters'];
};

export const convertModifiers = (
	modifiers: AbstractQueryModifiers | undefined,
	collection: string,
	idxGenerator: Generator<number, number, number>
): ModifierConversionResult => {
	const result: ModifierConversionResult = {
		clauses: { joins: [] },
		parameters: [],
	};

	if (modifiers?.filter) {
		const convertedFilter = convertFilter(modifiers.filter, collection, idxGenerator);
		result.clauses.where = convertedFilter.clauses.where;
		result.clauses.joins!.push(...convertedFilter.clauses.joins);
		result.parameters.push(...convertedFilter.parameters);
	}

	if (modifiers?.limit) {
		result.clauses.limit = { type: 'value', parameterIndex: idxGenerator.next().value };
		result.parameters.push(modifiers.limit.value);
	}

	if (modifiers?.offset) {
		result.clauses.offset = { type: 'value', parameterIndex: idxGenerator.next().value };
		result.parameters.push(modifiers.offset.value);
	}

	if (modifiers?.sort) {
		result.clauses.order = convertSort(modifiers.sort, collection, idxGenerator);
	}

	return result;
};
