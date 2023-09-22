/**
 * Converts an abstract query to the abstract SQL query ({@link AbstractSqlQuery}).
 * This converter is used as the first action within the SQL drivers.
 *
 * @module
 */
import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlQuery } from '../types/index.js';
import { parameterIndexGenerator } from './param-index-generator.js';
import { convertFilter, convertSort } from './modifiers/index.js';
import { convertNodesAndGenerateAliases } from './fields/index.js';

/**
 * Here the abstract query gets converted into the abstract SQL query.
 * It calls all related conversion functions and takes care of the parameter index.
 * This process, is also part of the ORM since here the aliases get generated and the mapping of aliases to the original fields is created.
 *
 * @param abstractQuery the abstract query to convert
 * @returns the abstract sql query
 */
export const convertQueryAndGenerateAliases = (
	abstractQuery: AbstractQuery
): { sql: AbstractSqlQuery; aliasMapping: Map<string, string[]> } => {
	const idGen = parameterIndexGenerator();

	const convertedSqlAndAliasMap = convertNodesAndGenerateAliases(abstractQuery.collection, abstractQuery.fields, idGen);

	const statement: AbstractSqlQuery = { ...convertedSqlAndAliasMap.sql, from: abstractQuery.collection };

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

	return {
		sql: statement,
		aliasMapping: convertedSqlAndAliasMap.aliasMapping,
	};
};
