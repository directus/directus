/**
 * Converts an abstract query to the abstract SQL query ({@link AbstractSqlClauses}).
 * This converter is used as the first action within the SQL drivers.
 *
 * @module
 */
import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlQuery } from '../types/index.js';
import type { ParameterTypes } from '../types/parameterized-statement.js';
import { parameterIndexGenerator } from './param-index-generator.js';
import { convertFilter, convertSort } from './modifiers/index.js';
import { convertFieldNodes } from './fields/index.js';

/**
 * Here the abstract query gets converted into the abstract SQL query.
 * It calls all related conversion functions and takes care of the parameter index.
 * This process, is also part of the ORM since here the aliases get generated and the mapping of aliases to the original fields is created.
 *
 * @param abstractQuery the abstract query to convert
 * @returns the abstract sql query
 */
export const convertQuery = (abstractQuery: AbstractQuery): AbstractSqlQuery => {
	const idGen = parameterIndexGenerator();
	const parameters: ParameterTypes[] = [];

	// fields
	const convertedFieldNodes = convertFieldNodes(abstractQuery.collection, abstractQuery.fields, idGen);
	const clauses: AbstractSqlClauses = { ...convertedFieldNodes.clauses, from: abstractQuery.collection };

	// modifiers
	if (abstractQuery.modifiers?.filter) {
		const convertedFilter = convertFilter(abstractQuery.modifiers.filter, abstractQuery.collection, idGen);
		clauses.where = convertedFilter.where;
		parameters.push(...convertedFilter.parameters);
	}

	if (abstractQuery.modifiers?.limit) {
		clauses.limit = { type: 'value', parameterIndex: idGen.next().value };
		parameters.push(abstractQuery.modifiers.limit.value);
	}

	if (abstractQuery.modifiers?.offset) {
		clauses.offset = { type: 'value', parameterIndex: idGen.next().value };
		parameters.push(abstractQuery.modifiers.offset.value);
	}

	if (abstractQuery.modifiers?.sort) {
		clauses.order = convertSort(abstractQuery.modifiers.sort);
	}

	return {
		clauses,
		parameters,
		aliasMapping: convertedFieldNodes.aliasMapping,
	};
};
