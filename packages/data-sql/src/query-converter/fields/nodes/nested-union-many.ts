import type {
	AbstractQueryFieldNodeNestedRelationalUnionsCollection,
	AbstractQueryFieldNodeNestedUnionMany,
	AtLeastOneElement,
} from '@directus/data';
import { createIndexGenerators, type IndexGenerators } from '../../utils/create-index-generators.js';
import { convertFieldNodes } from '../fields.js';
import type { SubQueries, ConverterResult, AliasMapping } from '../../../types/abstract-sql.js';
import type {
	AbstractSqlQueryLogicalNode,
	AbstractSqlQuerySelectPrimitiveNode,
	ParameterTypes,
} from '../../../index.js';
import type { NumberGenerator } from '../../utils/number-generator.js';
import { createPrimitiveSelect } from './primitive-select.js';
import { findIndexForColumn } from '../../utils/findex-finder.js';

export interface NestedUnionResult {
	/** Function to generate a sub query */
	subQueries: SubQueries;

	/** The selection of the primary key field */
	selects: AbstractSqlQuerySelectPrimitiveNode[];
}

/**
 * Converts a node which specifies a o2a into a generator to create a sub query using the root result.
 *
 * @param rootCollection - the current collection, will be an alias when called recursively
 * @param field - the nested field data from the abstract query
 * @returns The result includes a function which creates a query as well as an abstract select to ensure the any column is queried in the root request.
 */
export function getNestedUnionMany(
	field: AbstractQueryFieldNodeNestedUnionMany,
	rootTableIndex: number,
	currentColumnIndexGenerator: NumberGenerator,
	rootAliasMapping: AliasMapping,
): NestedUnionResult {
	const firstIdField = field.nesting.identifierFields[0];
	const firstIdFieldIndex = findIndexForColumn(rootAliasMapping, firstIdField);
	const subQueries = createFunctionsToGenerateSubQueries(field.nesting.collections, firstIdFieldIndex);
	const selects = getIdFieldSelects(rootTableIndex, field.nesting.identifierFields, currentColumnIndexGenerator);

	return { subQueries, selects };
}

/**
 * Creates a functions which generates all sub queries.
 *
 * @param nestedCollections
 * @param rootIdentifierFields
 * @returns All the sub queries which need to be queried.
 */
function createFunctionsToGenerateSubQueries(
	nestedCollections: AbstractQueryFieldNodeNestedRelationalUnionsCollection[],
	idFieldIndex: number,
): SubQueries {
	return function (rootRow: Record<string, unknown>): ConverterResult[] {
		return nestedCollections.map((nestedCollection) => {
			const indexGenerators = createIndexGenerators();
			const tableIndex = indexGenerators.table.next().value;
			const desiredFields = nestedCollection.fields;
			const nestedFieldNodes = convertFieldNodes(desiredFields, tableIndex, indexGenerators);

			const condition = createCondition(
				nestedCollection,
				tableIndex,
				nestedCollection.relational.collectionName,
				rootRow[`c${idFieldIndex}`] as string | number,
				indexGenerators,
			);

			return {
				rootQuery: {
					clauses: {
						select: nestedFieldNodes.clauses.select,
						from: {
							tableName: nestedCollection.relational.collectionName,
							tableIndex,
						},
						joins: nestedFieldNodes.clauses.joins,
						where: condition.conditions,
					},
					parameters: [...nestedFieldNodes.parameters, ...condition.parameters],
				},
				subQueries: nestedFieldNodes.subQueries,
				aliasMapping: nestedFieldNodes.aliasMapping,
			};
		});
	};
}

/**
 * Creates selects for the primary key columns.
 * Those need to be queries because it contain the primary key values.
 *
 * @param rootCollection
 * @param rootIdentifierFields
 * @returns The abstract select part for the primary key field.
 */
function getIdFieldSelects(
	tableIndex: number,
	rootIdentifierFields: AtLeastOneElement<string>,
	columnIndexGenerator: NumberGenerator,
): AbstractSqlQuerySelectPrimitiveNode[] {
	return rootIdentifierFields.map((idField) =>
		createPrimitiveSelect(tableIndex, idField, columnIndexGenerator.next().value),
	);
}

function createCondition(
	collection: AbstractQueryFieldNodeNestedRelationalUnionsCollection,
	tableIndex: number,
	foreignCollection: string,
	foreignKeyValue: string | number,
	indexGens: IndexGenerators,
): { conditions: AbstractSqlQueryLogicalNode; parameters: ParameterTypes[] } {
	const conditions: AbstractSqlQueryLogicalNode = {
		type: 'logical',
		negate: false,
		operator: 'and',
		childNodes: [
			{
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'json',
						tableIndex: tableIndex,
						columnName: collection.relational.relationalField,
						path: [indexGens.parameter.next().value],
					},
					compareTo: {
						type: 'value',
						parameterIndex: indexGens.parameter.next().value,
					},
					operation: 'eq',
				},
			},
			{
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'json',
						tableIndex: tableIndex,
						columnName: collection.relational.relationalField,
						path: [indexGens.parameter.next().value, 0],
						pathIsIndex: true,
					},
					compareTo: {
						type: 'value',
						parameterIndex: indexGens.parameter.next().value,
					},
					operation: 'eq',
				},
			},
		],
	};

	const parameters: ParameterTypes[] = ['foreignCollection', foreignCollection, 'foreignKey', foreignKeyValue];

	return { conditions, parameters };
}
