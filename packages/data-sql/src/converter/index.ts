import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlQuery } from '../types/index.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';
import { convertFilter, convertSort } from './modifiers/index.js';
import { convertNodes } from './nodes/index.js';

/**
 * @param abstractQuery the abstract query to convert
 * @returns a format very close to actual SQL but without making assumptions about the actual SQL dialect
 */
export const convertAbstractQueryToAbstractSqlQuery = (abstractQuery: AbstractQuery): AbstractSqlQuery => {
	const idGen = parameterIndexGenerator();

	const statement: AbstractSqlQuery = {
		...convertNodes(abstractQuery.collection, abstractQuery.nodes, idGen),
		from: abstractQuery.collection,
	};

	if (abstractQuery.modifiers?.filter) {
		const convertedFilter = convertFilter(abstractQuery.modifiers.filter, abstractQuery.collection, idGen);

		statement.where = convertedFilter.where;
		statement.parameters.push(...convertedFilter.parameters);
	}

	if (abstractQuery.modifiers?.limit) {
		statement.limit = { type: 'value', parameterIndex: idGen.next().value };
		statement.parameters.push(abstractQuery.modifiers.limit.value);
	}

	if (abstractQuery.modifiers?.offset) {
		statement.offset = { type: 'value', parameterIndex: idGen.next().value };
		statement.parameters.push(abstractQuery.modifiers.offset.value);
	}

	if (abstractQuery.modifiers?.sort) {
		statement.order = convertSort(abstractQuery.modifiers.sort);
	}

	return statement;
};
