import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalAny,
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
		function preparedSubQuery(rel: A2ORelation): SubQuery {
			const indexGenerator = parameterIndexGenerator();

			const nestedFieldNodes = convertFieldNodes(
				collection.relational.collectionName,
				collection.fields,
				indexGenerator,
			);

			const joins = [...nestedFieldNodes.clauses.joins];
			const nestedParameters = [...nestedFieldNodes.parameters];

			const fKs = collection.relational.identifierFields.map((idField) => {
				const correspondingObj = rel.foreignKey.find((fk) => fk.column === idField);
				if (!correspondingObj) throw new Error('No corresponding foreign key found.');
				return correspondingObj.value;
			});

			return function () {
				return {
					rootQuery: {
						clauses: {
							select: nestedFieldNodes.clauses.select,
							from: collection.relational.collectionName,
							joins: joins,
							where: getRelationConditions(rel, indexGenerator, field.nesting),
						},
						parameters: [...nestedParameters, ...fKs],
					},
					subQueries: nestedFieldNodes.subQueries,
					aliasMapping: nestedFieldNodes.aliasMapping,
				};
			};
		}

		subQueryLoopUp.set(collection.relational.collectionName, preparedSubQuery);
	});

	return subQueryLoopUp;
}

function getRelationConditions(
	jsonColumn: A2ORelation,
	idxGenerator: Generator<number, number, number>,
	relAny: AbstractQueryFieldNodeNestedRelationalAny,
): AbstractSqlQueryWhereNode {
	const tableFromJsonColumn = jsonColumn.foreignCollection;

	const nestedCollection = relAny.collections.find(
		(collection) => collection.relational.collectionName === tableFromJsonColumn,
	);

	if (!nestedCollection) throw new Error('No relational data found for the collection stated in the json column');

	if (jsonColumn.foreignKey.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: nestedCollection.relational.identifierFields.map((idField) =>
				getRelationCondition(tableFromJsonColumn, idField, idxGenerator),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getRelationCondition(tableFromJsonColumn, nestedCollection.relational.identifierFields[0], idxGenerator);
	}
}
