import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalAny,
	AbstractQueryFieldNodeNestedRelationalAnyCollection,
	AbstractQueryFieldNodeNestedUnionOne,
	AtLeastOneElement,
} from '@directus/data';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { convertFieldNodes } from './fields.js';
import { getRelationCondition, type NestedManyResult } from './create-nested-manys.js';
import type { AbstractSqlQueryConditionNode } from '../../types/clauses/where/condition.js';
import { createUniqueAlias, type AbstractSqlQueryWhereNode, type SubQuery } from '../../index.js';

/**
 * Converts a nested union one node from the abstract query into a function which creates the sub query for a2o.
 *
 * @param collection - the current collection, will be an alias when called recursively
 * @param field - the nested field data from the abstract query
 * @returns The result includes a function which creates a query as well as an abstract select to ensure the any column is queried in the root request.
 */
export function getNestedUnionOne(collection: string, field: AbstractQueryFieldNodeNestedUnionOne): NestedManyResult {
	const generatedAlias = createUniqueAlias(field.nesting.field);
	const lookUp = createSubQueryLookUp(field);

	return {
		subQuery: (rootRow) => {
			const anyColumnValue = rootRow[generatedAlias] as A2ORelation | undefined;
			if (!anyColumnValue) throw new Error('No value found for any column.');
			const subQueryGenerator = lookUp.get(anyColumnValue.foreignCollection);
			if (!subQueryGenerator) throw new Error('No sub query generator found.');
			return subQueryGenerator(anyColumnValue)(rootRow);
		},
		select: [
			{
				type: 'primitive',
				table: collection,
				column: field.nesting.field,
				as: generatedAlias,
			},
		],
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
): Map<string, (rel: A2ORelation) => SubQuery> {
	const subQueryLoopUp = new Map<string, (rel: A2ORelation) => SubQuery>();

	field.nesting.collections.forEach((collection) => {
		const generatorFunction = createSubQueryGenerator(collection, field.nesting);
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
	nesting: AbstractQueryFieldNodeNestedRelationalAny,
) {
	return (rel: A2ORelation): SubQuery => {
		const indexGenerator = parameterIndexGenerator();
		const nestedFieldNodes = convertFieldNodes(collection.relational.collectionName, collection.fields, indexGenerator);

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
						from: collection.relational.collectionName,
						joins: nestedFieldNodes.clauses.joins,
						where: getRelationalCondition(rel, indexGenerator, nesting),
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
function getRelationalCondition(
	jsonColumn: A2ORelation,
	idxGenerator: Generator<number, number, number>,
	relAny: AbstractQueryFieldNodeNestedRelationalAny,
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
				getRelationCondition(jsonColumn.foreignCollection, idField, idxGenerator),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	}

	return getRelationCondition(
		jsonColumn.foreignCollection,
		nestedCollection.relational.identifierFields[0],
		idxGenerator,
	);
}
