/**
 * nested many nodes are handled by the driver.
 * As a default behavior, we do separate queries for each o part result row.
 * The driver itself can use different technique if another technique is more performant,
 * like do a sub query in the statement or a join.
 */
import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalMany,
	AbstractQueryFieldNodeNestedSingleMany,
	AtLeastOneElement,
	FkEntry,
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
 * @param collection - the current collection, will be an alias when called recursively
 * @param field - the nested field data from the abstract query
 * @returns A function which creates a sub query and the select part for the root query
 */
export function getNestedMany(collection: string, field: AbstractQueryFieldNodeNestedSingleMany): NestedManyResult {
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
		where: getFilters(nestedModifiers.clauses.where, field.nesting, index),
	};

	const generatedAliases = field.nesting.local.fields.map((field) => [field, createUniqueAlias(field)] as const);
	const generatedAliasMap = Object.fromEntries(generatedAliases);
	const select = generatedAliases.map(([field, alias]) => createPrimitiveSelect(collection, field, alias));

	return {
		subQuery: (rootRow) => {
			const params = [...parameters];

			if (field.nesting.is2a) {
				const foreignKey: FkEntry[] = [];

				field.nesting.local.fields.map((field) => {
					const id = rootRow[generatedAliasMap[field]!] as string;
					const fkEntry: FkEntry = { column: field, value: id };
					foreignKey.push(fkEntry);
				});

				const theRelationalJsonValue: A2ORelation = {
					foreignCollection: field.nesting.foreign.collection,
					foreignKey: foreignKey as AtLeastOneElement<FkEntry>,
				};

				params.push(JSON.stringify(theRelationalJsonValue));
			} else {
				params.push(...field.nesting.local.fields.map((field) => rootRow[generatedAliasMap[field]!] as string));
			}

			return {
				rootQuery: {
					clauses,
					parameters: params,
				},
				subQueries: nestedFieldNodes.subQueries,
				aliasMapping: nestedFieldNodes.aliasMapping,
			};
		},
		select,
	};
}

function getFilters(
	nestedWhere: AbstractSqlQueryWhereNode | undefined,
	nesting: AbstractQueryFieldNodeNestedRelationalMany,
	idxGenerator: Generator<number, number, number>,
): AbstractSqlQueryWhereNode {
	if (nestedWhere) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: [nestedWhere, getRelationConditions(nesting, idxGenerator)],
		};
	}

	return getRelationConditions(nesting, idxGenerator);
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
export function getRelationCondition(
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
