/**
 * Converts an abstract query to the abstract SQL query ({@link AbstractSqlClauses}).
 * This converter is used as the first action within the SQL drivers.
 *
 * @module
 */
import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlClauses, AliasMapping, ConverterResult, ParameterTypes, SubQuery } from '../types/index.js';
import { convertFieldNodes } from './fields/index.js';
import { convertModifiers } from './modifiers/modifiers.js';
import { createIndexGenerators } from '../utils/create-index-generators.js';

/**
 * Here the abstract query gets converted into the abstract SQL query.
 * It calls all related conversion functions and takes care of the parameter index.
 * This process, is also part of the ORM since here the aliases get generated and the mapping of aliases to the original fields is created.
 *
 * @param abstractQuery the abstract query to convert
 * @returns the abstract sql query
 */
export const convertQuery = (abstractQuery: AbstractQuery): ConverterResult => {
	const parameters: ParameterTypes[] = [];
	const subQueries: SubQuery[] = [];

	const indexGen = createIndexGenerators();

	const tableIndex = indexGen.table.next().value;

	let clauses: AbstractSqlClauses;
	let aliasMapping: AliasMapping;

	try {
		const from = { tableName: abstractQuery.collection, tableIndex };
		const convertedFieldNodes = convertFieldNodes(abstractQuery.fields, tableIndex, indexGen);
		clauses = { ...convertedFieldNodes.clauses, from };
		parameters.push(...convertedFieldNodes.parameters);
		aliasMapping = convertedFieldNodes.aliasMapping;
		subQueries.push(...convertedFieldNodes.subQueries);
	} catch (error: any) {
		throw new Error(`Failed to convert query fields: ${error.message}`);
	}

	try {
		const convertedModifiers = convertModifiers(abstractQuery.modifiers, tableIndex, indexGen);
		const joins = [...(clauses.joins ?? []), ...(convertedModifiers.clauses.joins ?? [])];
		clauses = { ...clauses, ...convertedModifiers.clauses, joins };
		parameters.push(...convertedModifiers.parameters);
	} catch (error: any) {
		throw new Error(`Failed to convert query modifiers: ${error.message}`);
	}

	return {
		rootQuery: {
			clauses,
			parameters,
		},
		subQueries,
		aliasMapping,
	};
};
