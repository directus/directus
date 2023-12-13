import type { AbstractQueryFieldNodeNestedSingleMany, AtLeastOneElement } from '@directus/data';
import type {
	AbstractSqlClauses,
	AbstractSqlQueryConditionNode,
	AbstractSqlQuerySelectNode,
	AbstractSqlQueryWhereNode,
	SubQuery,
} from '../../types/index.js';
import { createIndexGenerators, type IndexGenerators } from '../../utils/create-index-generators.js';
import { convertModifiers } from '../modifiers/modifiers.js';
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
 * @param tableIndex
 * @returns A function to create a query with and the select part for the root query
 */
export function getNestedMany(field: AbstractQueryFieldNodeNestedSingleMany, tableIndex: number): NestedManyResult {
	if (field.nesting.type !== 'relational-many') throw new Error('Nested o2a not yet implemented!');

	const indexGen = createIndexGenerators();

	const tableIndexRelational = indexGen.table.next().value;

	const from = { tableName: field.nesting.foreign.collection, tableIndex: tableIndexRelational };

	const nestedFieldNodes = convertFieldNodes(field.fields, tableIndexRelational, indexGen);
	const nestedModifiers = convertModifiers(field.modifiers, tableIndexRelational, indexGen);

	const joins = [...nestedFieldNodes.clauses.joins, ...(nestedModifiers.clauses.joins ?? [])];
	const parameters = [...nestedFieldNodes.parameters, ...nestedModifiers.parameters];

	const clauses: AbstractSqlClauses = {
		select: nestedFieldNodes.clauses.select,
		from,
		...nestedModifiers.clauses,
		joins: joins,
		where: nestedModifiers.clauses.where
			? {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						nestedModifiers.clauses.where,
						getRelationConditions(tableIndexRelational, field.nesting.foreign.fields, indexGen),
					],
			  }
			: getRelationConditions(tableIndexRelational, field.nesting.foreign.fields, indexGen),
	};

	const generatedAliases = field.nesting.local.fields.map((field) => [field, indexGen.column.next().value] as const);
	const generatedAliasMap = Object.fromEntries(generatedAliases);

	const select = generatedAliases.map(([field, alias]) => createPrimitiveSelect(tableIndex, field, alias));

	return {
		subQuery: (rootRow, columnIndexToName) => ({
			rootQuery: {
				clauses,
				parameters: [
					...parameters,
					...field.nesting.local.fields.map((field) => rootRow[columnIndexToName(generatedAliasMap[field]!)] as string),
				],
			},

			subQueries: nestedFieldNodes.subQueries,

			aliasMapping: nestedFieldNodes.aliasMapping,
		}),
		select,
	};
}

function getRelationConditions(
	tableIndex: number,
	foreignFields: AtLeastOneElement<string>,
	indexGen: IndexGenerators,
): AbstractSqlQueryWhereNode {
	if (foreignFields.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: foreignFields.map((field) =>
				getRelationCondition(tableIndex, field, indexGen),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getRelationCondition(tableIndex, foreignFields[0], indexGen);
	}
}

/**
 * Create the condition to match the foreign key with the local key
 *
 * @param tableIndex
 * @param columnName
 * @param indexGen
 * @returns
 */
function getRelationCondition(
	tableIndex: number,
	columnName: string,
	indexGen: IndexGenerators,
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		condition: {
			type: 'condition-string', // could also be a condition-number, but it doesn't matter because both support 'eq'
			operation: 'eq',
			target: {
				type: 'primitive',
				tableIndex,
				columnName,
			},
			compareTo: {
				type: 'value',
				parameterIndex: indexGen.parameter.next().value,
			},
		},
		negate: false,
	};
}
