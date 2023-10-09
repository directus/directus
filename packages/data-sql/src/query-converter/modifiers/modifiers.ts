import type { AbstractQueryModifiers } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQuery } from '../../types/index.js';
import { convertFilter, convertSort } from './index.js';

export type Result = {
	clauses: Pick<AbstractSqlClauses, 'where' | 'limit' | 'offset' | 'order'>;
	parameters: AbstractSqlQuery['parameters'];
};

export const convertModifiers = (
	modifiers: AbstractQueryModifiers | undefined,
	collection: string,
	idxGenerator: Generator<number, number, number>
) => {
	const result: Result = {
		clauses: {},
		parameters: [],
	};

	if (modifiers?.filter) {
		const convertedFilter = convertFilter(modifiers.filter, collection, idxGenerator);
		result.clauses.where = convertedFilter.where;
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
		result.clauses.order = convertSort(modifiers.sort);
	}

	return result;
};
