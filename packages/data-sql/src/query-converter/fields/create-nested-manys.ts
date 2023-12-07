import type {
	AbstractQueryFieldNodeNestedRelationalMany,
	AbstractQueryFieldNodeNestedSingleMany,
	AtLeastOneElement,
} from '@directus/data';
import type {
	AbstractSqlClauses,
	AbstractSqlQueryConditionNode,
	AbstractSqlQuerySelectNode,
	AbstractSqlQueryWhereNode,
	SubQuery,
} from '../../types/index.js';
import { createUniqueAlias } from '../../utils/create-unique-alias.js';
import { convertModifiers } from '../modifiers/modifiers.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { createPrimitiveSelect } from './create-primitive-select.js';
import { convertFieldNodes } from './fields.js';

export interface NestedManyResult {
	/** Function to generate a sub query */
	subQuery: SubQuery;

	/** The selection of the primary key field */
	select: AbstractSqlQuerySelectNode[];
}

/**
 * Converts a nested many node from the abstract query into a function which creates abstract SQL.
 * The generated function will be called later on, when the root query is executed and the result is available.
 *
 * @param field - the nested field data from the abstract query
 * @returns A function to create a query with and the select part for the root query
 */
export function getNestedMany(collection: string, field: AbstractQueryFieldNodeNestedSingleMany): NestedManyResult {
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

	const generatedAliases = field.nesting.local.fields.map((field) => [field, createUniqueAlias(field)] as const);
	const generatedAliasMap = Object.fromEntries(generatedAliases);

	const select = generatedAliases.map(([field, alias]) => createPrimitiveSelect(collection, field, alias));

	return {
		subQuery: (rootRow) => ({
			rootQuery: {
				clauses,
				parameters: [
					...parameters,
					...field.nesting.local.fields.map((field) => rootRow[generatedAliasMap[field]!] as string),
				],
			},

			subQueries: nestedFieldNodes.subQueries,

			aliasMapping: nestedFieldNodes.aliasMapping,
		}),
		select,
	};
}

function getRelationConditions(
	fieldNesting: AbstractQueryFieldNodeNestedRelationalMany,
	idxGenerator: Generator<number, number, number>,
): AbstractSqlQueryWhereNode {
	const table = fieldNesting.foreign.collection;

	if (fieldNesting.foreign.fields.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: fieldNesting.foreign.fields.map((field) =>
				getRelationCondition(table, field, idxGenerator),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getRelationCondition(table, fieldNesting.foreign.fields[0], idxGenerator);
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
