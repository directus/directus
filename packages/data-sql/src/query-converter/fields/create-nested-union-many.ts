import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalAnysCollection,
	AbstractQueryFieldNodeNestedUnionMany,
	AtLeastOneElement,
	FkEntry,
} from '@directus/data';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { convertFieldNodes } from './fields.js';
import { getRelationCondition } from './create-nested-manys.js';
import type { SubQueries, ConverterResult } from '../../types/abstract-sql.js';
import type { AbstractSqlQuerySelectPrimitiveNode } from '../../types/clauses/select/primitive.js';

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
	rootCollection: string,
	field: AbstractQueryFieldNodeNestedUnionMany,
): NestedUnionResult {
	return {
		subQueries: createFunctionToGenerateSubQueries(field.nesting.collections, field.localIdentifierFields),
		select: createPrimitiveSelect(rootCollection, field.localIdentifierFields),
	};
}

/**
 * Creates a functions which generates all sub queries.
 *
 * @param nestedCollections
 * @param rootIdentifierFields
 * @returns All the sub queries which need to be queried.
 */
function createFunctionToGenerateSubQueries(
	nestedCollections: AbstractQueryFieldNodeNestedRelationalAnysCollection[],
	rootIdentifierFields: AtLeastOneElement<string>,
) {
	return function (rootRow: Record<string, unknown>): ConverterResult[] {
		return nestedCollections.map((nestedCollection) => {
			const indexGenerator = parameterIndexGenerator();

			const nestedFieldNodes = convertFieldNodes(
				nestedCollection.relational.collectionName,
				nestedCollection.fields,
				indexGenerator,
			);

			const jsonValue = reCreateJsonValue(rootIdentifierFields, rootRow, nestedCollection.relational.collectionName);

			/** @TODO needs to be enhanced later to support additional modifiers */
			const where = getRelationCondition(
				nestedCollection.relational.collectionName,
				nestedCollection.relational.field,
				indexGenerator,
			);

			return {
				rootQuery: {
					clauses: {
						select: nestedFieldNodes.clauses.select,
						from: nestedCollection.relational.collectionName,
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

function createPrimitiveSelect(
	rootCollection: string,
	rootIdentifierFields: AtLeastOneElement<string>,
): AbstractSqlQuerySelectPrimitiveNode[] {
	return rootIdentifierFields.map((idField) => {
		return {
			type: 'primitive',
			table: rootCollection,
			column: idField,
			alias: 'generatedAliasMap[idField]' /** @TODO */,
		};
	});
}
