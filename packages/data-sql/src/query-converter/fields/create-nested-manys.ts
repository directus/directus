import type {
	AbstractQueryFieldNodeNestedRelationalMany,
	AbstractQueryFieldNodeNestedSingleMany,
	AtLeastOneElement,
} from '@directus/data';
import type {
	AbstractSqlClauses,
	AbstractSqlNestedMany,
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryWhereNode,
} from '../../types/index.js';
import { convertModifiers } from '../modifiers/modifiers.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { convertFieldNodes } from './fields.js';

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
export function getNestedMany(field: AbstractQueryFieldNodeNestedSingleMany): AbstractSqlNestedMany {
	if (field.nesting.type !== 'relational-many') throw new Error('Nested o2a not yet implemented!');

	const index = parameterIndexGenerator();

	const nestedFieldNodes = convertFieldNodes(field.nesting.foreign.collection, field.fields, index);
	const nestedModifiers = convertModifiers(field.modifiers, field.nesting.foreign.collection, index);

	const joins = [...nestedFieldNodes.clauses.joins, ...(nestedModifiers.clauses.joins ?? [])];
	const parameters = [...nestedFieldNodes.parameters, ...nestedModifiers.parameters];

	const clauses: AbstractSqlClauses = {
		select: nestedFieldNodes.clauses.select,
		from: field.nesting.foreign.collection,
		...nestedModifiers.clauses,
		joins: joins,
		where: nestedModifiers.clauses.where
			? {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [nestedModifiers.clauses.where, getRelationConditions(field.nesting, index)],
			  }
			: getRelationConditions(field.nesting, index),
	};

	return {
		queryGenerator: (identifierValues) => ({
			clauses,
			parameters: [...parameters, ...identifierValues],
			aliasMapping: nestedFieldNodes.aliasMapping,
			nestedManys: nestedFieldNodes.nestedManys,
		}),
		localJoinFields: field.nesting.local.fields,
		foreignJoinFields: field.nesting.foreign.fields,
		alias: field.alias,
	};
}

function getRelationConditions(
	fieldMeta: AbstractQueryFieldNodeNestedRelationalMany,
	idxGenerator: Generator<number, number, number>,
): AbstractSqlQueryWhereNode {
	const table = fieldMeta.foreign.collection;

	if (fieldMeta.foreign.fields.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: fieldMeta.foreign.fields.map((field) =>
				getRelationCondition(table, field, idxGenerator),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getRelationCondition(table, fieldMeta.foreign.fields[0], idxGenerator);
	}
}

/**
 * Create the condition to match the foreign key with the local key
 *
 * @param table
 * @param column
 * @param idxGenerator
 * @returns
 */
function getRelationCondition(
	table: string,
	column: string,
	idxGenerator: Generator<number, number, number>,
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
