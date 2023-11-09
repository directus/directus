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
import { convertFieldNodes } from './fields/index.js';
import { convertModifiers } from './modifiers/modifiers.js';
import { uniqWith, isEqual } from 'lodash-es';

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

	let clauses: AbstractSqlClauses;
	let aliasMapping: AbstractSqlQuery['aliasMapping'];
	let nestedManys: AbstractSqlQuery['nestedManys'];

	try {
		const convertedFieldNodes = convertFieldNodes(abstractQuery.collection, abstractQuery.fields, idGen);
		clauses = { ...convertedFieldNodes.clauses, from: abstractQuery.collection };
		parameters.push(...convertedFieldNodes.parameters);
		aliasMapping = convertedFieldNodes.aliasMapping;
		nestedManys = convertedFieldNodes.nestedManys;
	} catch (error: any) {
		throw new Error(`Failed to convert query fields: ${error.message}`);
	}

	try {
		const convertedModifiers = convertModifiers(abstractQuery.modifiers, abstractQuery.collection, idGen);
		clauses = { ...clauses, ...convertedModifiers.clauses };
		parameters.push(...convertedModifiers.parameters);
	} catch (error: any) {
		throw new Error(`Failed to convert query modifiers: ${error.message}`);
	}

	clauses = removeDuplicatedJoins(clauses);

	return {
		clauses,
		parameters,
		aliasMapping,
		nestedManys,
	};
};

/**
 * Both the field conversion and the modifier conversion return a join clause.
 * Since those join clauses can be exactly the same, we need to remove the duplicates.
 *
 * @param clauses all the generated clauses
 * @returns all the clauses with only unique joins
 */
function removeDuplicatedJoins(clauses: AbstractSqlClauses): AbstractSqlClauses {
	const uniqueJoins = uniqWith(clauses.joins, isEqual);
	return { ...clauses, joins: uniqueJoins };
}
