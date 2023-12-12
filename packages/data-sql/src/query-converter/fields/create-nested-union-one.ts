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
import { createUniqueAlias, type AbstractSqlQueryWhereNode } from '../../index.js';

/**
 * Converts a nested union one node from the abstract query into a function which creates the sub query for a2o.
 *
 * @param collection - the current collection, will be an alias when called recursively
 * @param field - the nested field data from the abstract query
 * @returns A function to create a query with and the select part for the root query
 */
export function getNestedUnionOne(collection: string, field: AbstractQueryFieldNodeNestedUnionOne): NestedManyResult {
	const generatedAlias = createUniqueAlias(field.nesting.field);

	return {
		subQuery: (rootRow) => {
			// get data from the relational column
			const anyColumnValue = rootRow[generatedAlias] as A2ORelation;
			const foreignTable = anyColumnValue.foreignCollection;
			const fk = anyColumnValue.foreignKey;

			// get the correct collection from the abstract query for this row
			const desiredRelationalInfo = field.nesting.collections.find((c) => c.relational.collectionName === foreignTable);
			if (!desiredRelationalInfo) throw new Error('Relational data is not sufficient in abstract query.');

			const indexGenerator = parameterIndexGenerator();
			const nestedFieldNodes = convertFieldNodes(foreignTable, desiredRelationalInfo?.fields, indexGenerator);

			const joins = [...nestedFieldNodes.clauses.joins];
			const nestedParameters = [...nestedFieldNodes.parameters];

			return {
				rootQuery: {
					clauses: {
						select: nestedFieldNodes.clauses.select,
						from: anyColumnValue.foreignCollection,
						joins: joins,
						where: getRelationConditions(anyColumnValue, indexGenerator, field.nesting),
					},
					parameters: [...nestedParameters, ...fk],
				},
				subQueries: nestedFieldNodes.subQueries,
				aliasMapping: nestedFieldNodes.aliasMapping,
			};
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

function getRelationConditions(
	jsonColumn: A2ORelation,
	idxGenerator: Generator<number, number, number>,
	relAny: AbstractQueryFieldNodeNestedRelationalAny,
): AbstractSqlQueryWhereNode {
	const table = jsonColumn.foreignCollection;

	const foreignCollectionRelationalData = relAny.collections.find(
		(collection) => collection.relational.collectionName === table,
	);

	if (!foreignCollectionRelationalData) throw new Error('No relational data found for collection');

	if (jsonColumn.foreignKey.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: foreignCollectionRelationalData.relational.identifierFields.map((fkValue) =>
				getRelationCondition(table, fkValue, idxGenerator),
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getRelationCondition(table, foreignCollectionRelationalData.relational.identifierFields[0], idxGenerator);
	}
}
