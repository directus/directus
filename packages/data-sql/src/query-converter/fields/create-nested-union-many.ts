import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalAnysCollection,
	AbstractQueryFieldNodeNestedUnionMany,
	AtLeastOneElement,
	FkEntry,
} from '@directus/data';
import { createIndexGenerators } from '../utils/create-index-generators.js';

import { convertFieldNodes } from './fields.js';
import { getRelationCondition } from './create-nested-manys.js';
import type { SubQueries, ConverterResult } from '../../types/abstract-sql.js';
import type { AbstractSqlQuerySelectPrimitiveNode } from '../../types/clauses/select/primitive.js';
import { createPrimitiveSelect } from './create-primitive-select.js';
import type { NumberGenerator } from '../utils/number-generator.js';

export interface NestedUnionResult {
	/** Function to generate a sub query */
	subQueries: SubQueries;

	/** The selection of the primary key field */
	select: AbstractSqlQuerySelectPrimitiveNode[];
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
): NestedUnionResult {
	return {
		subQueries: createFunctionsToGenerateSubQueries(field.nesting.collections, field.localIdentifierFields),
		select: createPrimitiveSelects(rootTableIndex, field.localIdentifierFields, currentColumnIndexGenerator),
	};
}

/**
 * Creates a functions which generates all sub queries.
 *
 * @param nestedCollections
 * @param rootIdentifierFields
 * @returns All the sub queries which need to be queried.
 */
function createFunctionsToGenerateSubQueries(
	nestedCollections: AbstractQueryFieldNodeNestedRelationalAnysCollection[],
	rootIdentifierFields: AtLeastOneElement<string>,
): SubQueries {
	return function (rootRow: Record<string, unknown>): ConverterResult[] {
		return nestedCollections.map((nestedCollection) => {
			const indexGenerators = createIndexGenerators();
			const tableIndex = indexGenerators.table.next().value;
			const nestedFieldNodes = convertFieldNodes(nestedCollection.fields, tableIndex, indexGenerators);
			const jsonValue = reCreateJsonValue(rootIdentifierFields, rootRow, nestedCollection.relational.collectionName);
			const where = getRelationCondition(tableIndex, nestedCollection.relational.field, indexGenerators);

			return {
				rootQuery: {
					clauses: {
						select: nestedFieldNodes.clauses.select,
						from: {
							tableName: nestedCollection.relational.collectionName,
							tableIndex,
						},
						joins: nestedFieldNodes.clauses.joins,
						where,
					},
					parameters: [...nestedFieldNodes.parameters, ...JSON.stringify(jsonValue)],
				},
				subQueries: nestedFieldNodes.subQueries,
				aliasMapping: nestedFieldNodes.aliasMapping,
			};
		});
	};
}

/**
 * @TODO
 * The keys in the json field are not ordered.
 * Therefore we don't know how they are stored in the json field.
 * We need to make them ordered so we can query them probably
 * or the above layer takes care putting the id field in the right order.
 *
 * Recreates the JSON value which lives in the any-collection, so we can filter the any collection with that value.
 * @param localIdentifierFields
 * @param rootRow
 * @param nestedCollectionName
 * @returns The JSON value which is stored in the any collection.
 */
function reCreateJsonValue(
	localIdentifierFields: AtLeastOneElement<string>,
	rootRow: Record<string, unknown>,
	nestedCollectionName: string,
): A2ORelation {
	return {
		foreignKey: localIdentifierFields.map((localIdentifierField) => {
			const keyValue = rootRow[localIdentifierField];
			if (!keyValue) throw new Error('No value found for any column.');
			return { column: localIdentifierField, value: keyValue as string };
		}) as AtLeastOneElement<FkEntry>,
		foreignCollection: nestedCollectionName,
	};
}

/**
 * This function creates the abstract select part for the primary key column.
 *
 * @remarks
 * Since the primary key column is always needed in the root query to construct the filter condition,
 * we need to make sure that the pk column is also part of the select statement.
 *
 * @param rootCollection
 * @param rootIdentifierFields
 * @returns The abstract select part for the primary key field.
 */
function createPrimitiveSelects(
	tableIndex: number,
	rootIdentifierFields: AtLeastOneElement<string>,
	columnIndexGenerator: NumberGenerator,
): AbstractSqlQuerySelectPrimitiveNode[] {
	return rootIdentifierFields.map((idField) =>
		createPrimitiveSelect(tableIndex, idField, columnIndexGenerator.next().value),
	);
}
