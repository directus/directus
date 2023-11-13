import type { AbstractQueryFieldNodeRelationalOneToMany, AtLeastOneElement } from '@directus/data';
import type { AbstractSqlNestedMany, AbstractSqlQueryConditionNode, AbstractSqlQueryWhereNode } from '../../index.js';
import type { FieldConversionResult } from './fields.js';

/**
 * Converts a nested many node from the abstract query into a function which creates abstract SQL.
 * The generated function will be called later on, when the root query is executed and the result is available.
 *
 * @param fieldMeta - the relational meta data from the abstract query
 * @param nestedOutput - the result of the nested field conversion
 * @param idxGenerator - the generator used to increase the parameter indices
 * @param alias - the alias of the foreign collection
 * @returns A function to create a query with and information about the relation
 */
export function getNestedMany(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	nestedOutput: FieldConversionResult,
	idxGenerator: Generator<number, number, number>,
	alias: string
): AbstractSqlNestedMany {
	const where = getWhereClause(fieldMeta, idxGenerator);

	return {
		queryGenerator: (identifierValues) => ({
			clauses: {
				select: nestedOutput.clauses.select,
				from: fieldMeta.join.foreign.collection,
				where,
			},
			parameters: [...nestedOutput.parameters, ...identifierValues],
			aliasMapping: nestedOutput.aliasMapping,
			nestedManys: nestedOutput.nestedManys,
		}),
		localJoinFields: fieldMeta.join.local.fields,
		foreignJoinFields: fieldMeta.join.foreign.fields,
		alias,
	};
}

function getWhereClause(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryWhereNode {
	const table = fieldMeta.join.foreign.collection;

	if (fieldMeta.join.local.fields.length > 1 && fieldMeta.join.foreign.fields.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: fieldMeta.join.foreign.fields.map((field) =>
				getCondition(table, field, idxGenerator)
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getCondition(table, fieldMeta.join.foreign.fields[0], idxGenerator);
	}
}

function getCondition(
	table: string,
	column: string,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		condition: {
			type: 'condition-string', // could also be a condition-number, but it doesn't matter because both support 'eq'
			operation: 'eq',
			target: {
				type: 'primitive',
				table,
				column,
			},
			compareTo: {
				type: 'value',
				parameterIndex: idxGenerator.next().value,
			},
		},
		negate: false,
	};
}
