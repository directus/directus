import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalAnyCollection,
	AbstractQueryFieldNodeNestedUnionOne,
	AtLeastOneElement,
	AbstractQueryFieldNodeNestedUnionRelational,
} from '@directus/data';
import { createIndexGenerators, type IndexGenerators } from '../../utils/create-index-generators.js';
import { convertFieldNodes } from '../fields.js';
import { getRelationCondition, type NestedManyResult } from './nested-manys.js';
import type { AbstractSqlQueryConditionNode } from '../../../types/clauses/where/condition.js';
import type { AbstractSqlQueryWhereNode, SubQuery } from '../../../index.js';
import { createPrimitiveSelect } from './primitive-select.js';

/**
 * Converts a nested union one node from the abstract query into a function which creates the sub query for a2o.
 *
 * @param field - the nested field data from the abstract query
 * @param tableIndex - the index of the current collection, will be an alias when called recursively
 * @param currentIndexGen - the index generator for the current collection
 * @returns The result includes a function which creates a query as well as an abstract select to ensure the any column is queried in the root request.
 */
export function getNestedUnionOne(
	field: AbstractQueryFieldNodeNestedUnionOne,
	tableIndex: number,
	currentIndexGen: IndexGenerators,
): NestedManyResult {
	const unionColumnIndex = currentIndexGen.column.next().value;
	const indexGenerators = createIndexGenerators();
	const lookUp = createSubQueryLookUp(field, indexGenerators);

	return {
		subQuery: (rootRow, columnIndexToIdentifier) => {
			const aliasOfIdField = columnIndexToIdentifier(unionColumnIndex);
			const relationalJson = rootRow[aliasOfIdField] as A2ORelation;
			if (!relationalJson) throw new Error(`Column ${aliasOfIdField} was not found in root query result.`);
			const subQueryGenerator = lookUp.get(relationalJson.foreignCollection);
			if (!subQueryGenerator) throw new Error('No sub query generator found.');
			return subQueryGenerator(relationalJson)(rootRow, columnIndexToIdentifier);
		},
		select: [createPrimitiveSelect(tableIndex, field.nesting.field, unionColumnIndex)],
	};
}

/**
 * Creates all possible sub queries and stores them in a map.
 * This way we don't have to to create the sub queries individually per row.
 *
 * @param field the abstract query field node
 * @returns A map which has all possible sub queries stored.
 */
function createSubQueryLookUp(
	field: AbstractQueryFieldNodeNestedUnionOne,
	indexGenerators: IndexGenerators,
): Map<string, (rel: A2ORelation) => SubQuery> {
	const subQueryLoopUp = new Map<string, (rel: A2ORelation) => SubQuery>();

	field.nesting.collections.forEach((collection) => {
		const generatorFunction = createSubQueryGenerator(collection, field.nesting, indexGenerators);
		subQueryLoopUp.set(collection.relational.collectionName, generatorFunction);
	});

	return subQueryLoopUp;
}

/**
 * Creates a sub query function for a specific collection.
 *
 * @param collection
 * @param nesting
 * @returns A function which creates the sub query for a specific collection.
 */
function createSubQueryGenerator(
	collection: AbstractQueryFieldNodeNestedRelationalAnyCollection,
	nesting: AbstractQueryFieldNodeNestedUnionRelational,
	indexGenerators: IndexGenerators,
): (rel: A2ORelation) => SubQuery {
	return (rel: A2ORelation): SubQuery => {
		const tableIndex = indexGenerators.table.next().value;
		const nestedFieldNodes = convertFieldNodes(collection.fields, tableIndex, indexGenerators);

		const fKs = collection.relational.identifierFields.map((idField) => {
			const correspondingObj = rel.foreignKey.find((fk) => fk.column === idField);
			if (!correspondingObj) throw new Error('No corresponding foreign key found.');
			return correspondingObj.value;
		});

		return () => {
			return {
				rootQuery: {
					clauses: {
						select: nestedFieldNodes.clauses.select,
						from: {
							tableName: collection.relational.collectionName,
							tableIndex,
						},
						joins: nestedFieldNodes.clauses.joins,
						where: getCondition(rel, indexGenerators, nesting, tableIndex),
					},
					parameters: [...nestedFieldNodes.parameters, ...fKs],
				},
				subQueries: nestedFieldNodes.subQueries,
				aliasMapping: nestedFieldNodes.aliasMapping,
			};
		};
	};
}

/**
 * Creates the where condition to filter the foreign collection.
 *
 * @param jsonColumn
 * @param idxGenerator
 * @param relAny
 * @returns Either a single condition or a logical condition with multiple conditions for composite keys.
 */
function getCondition(
	jsonColumn: A2ORelation,
	idxGenerators: IndexGenerators,
	relAny: AbstractQueryFieldNodeNestedUnionRelational,
	tableIndex: number,
): AbstractSqlQueryWhereNode {
	const nestedCollection = relAny.collections.find(
		(collection) => collection.relational.collectionName === jsonColumn.foreignCollection,
	);

	if (!nestedCollection) {
		throw new Error('No relational data found for the collection stated in the json column');
	}

	if (jsonColumn.foreignKey.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: nestedCollection.relational.identifierFields.map((idField) =>
				getRelationCondition(tableIndex, idField, idxGenerators),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	}

	return getRelationCondition(tableIndex, nestedCollection.relational.identifierFields[0], idxGenerators);
}
