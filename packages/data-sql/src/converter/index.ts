import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlQuery } from '../types.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';
import { convertFilter, convertSort } from './modifiers/index.js';
import { convertNodes } from './nodes/index.js';
import { convertGeoValues } from './Geometry/index.js';

/**
 * @param abstractQuery the abstract query to convert
 * @returns a format very close to actual SQL but without making assumptions about the actual SQL dialect
 */
export const convertAbstractQueryToAbstractSqlQuery = (abstractQuery: AbstractQuery): AbstractSqlQuery => {
	const statement: AbstractSqlQuery = {
		...convertNodes(abstractQuery.collection, abstractQuery.nodes),
		from: abstractQuery.collection,
		parameters: [],
	};

	const idGen = parameterIndexGenerator();

	if (abstractQuery.modifiers?.filter) {
		const convertedFilter = convertFilter(abstractQuery.modifiers.filter, abstractQuery.collection, idGen);

		statement.where = convertedFilter.where;
		statement.parameters.push(...convertedFilter.parameters);
	}

	// TODO: Create a generic function for this and add unit tests. This way we might can save some tests in index.test.ts

	if (abstractQuery.modifiers?.limit) {
		statement.limit = { parameterIndex: idGen.next().value };
		statement.parameters.push(abstractQuery.modifiers.limit.value);
	}

	if (abstractQuery.modifiers?.offset) {
		statement.offset = { parameterIndex: idGen.next().value };
		statement.parameters.push(abstractQuery.modifiers.offset.value);
	}

	if (abstractQuery.modifiers?.sort) {
		statement.order = convertSort(abstractQuery.modifiers.sort);
	}

	statement.parameters = convertGeoValues(statement.parameters);

	return statement;
};
