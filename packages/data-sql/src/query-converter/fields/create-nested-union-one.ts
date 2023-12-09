import type {
	A2ORelation,
	AbstractQueryFieldNodeNestedRelationalAny,
	AbstractQueryFieldNodeNestedUnionOne,
	AtLeastOneElement,
} from '@directus/data';
// import { createUniqueAlias } from '../../utils/create-unique-alias.js';
// import { convertModifiers } from '../modifiers/modifiers.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
// import { createPrimitiveSelect } from './create-primitive-select.js';
import { convertFieldNodes } from './fields.js';
import { getRelationCondition, type NestedManyResult } from './create-nested-manys.js';
import type { AbstractSqlQueryConditionNode } from '../../types/clauses/where/condition.js';
import type { AbstractSqlQueryWhereNode } from '../../index.js';

/**
 * Converts a nested union one node from the abstract query into a function which creates the sub query for a2o.
 *
 * @param collection - the current collection, will be an alias when called recursively
 * @param field - the nested field data from the abstract query
 * @returns A function to create a query with and the select part for the root query
 */
export function getNestedUnionOne(collection: string, field: AbstractQueryFieldNodeNestedUnionOne): NestedManyResult {
	const index = parameterIndexGenerator();

	return {
		subQuery: (rootRow) => {
			// get data from the relational column
			const anyColumnValue = rootRow[field.nesting.field] as A2ORelation;
			const foreignTable = anyColumnValue.foreignCollection;
			const fk = anyColumnValue.foreignKey;

			// get the correct collection from the abstract query for this row
			const desiredRelationalInfo = field.nesting.collections.find((c) => c.relational.collectionName === foreignTable);
			if (!desiredRelationalInfo?.fields) throw new Error('No relational data found for collection');

			// get the nested select - not needed in this case
			// const generatedAliases = desiredRelationalInfo.fields.map((field) => [field, createUniqueAlias(field)] as const);
			// const generatedAliasMap = Object.fromEntries(generatedAliases);
			// const select = generatedAliases.map(([field, alias]) => createPrimitiveSelect(collection, field, alias));

			// Convert
			const nestedFieldNodes = convertFieldNodes(foreignTable, desiredRelationalInfo?.fields, index);
			// const nestedModifiers = convertModifiers(field.modifiers, field.nesting.foreign.collection, index);

			const joins = [...nestedFieldNodes.clauses.joins]; //  ...(nestedModifiers.clauses.joins ?? [])
			const parameters = [...nestedFieldNodes.parameters]; // ...nestedModifiers.parameters

			return {
				rootQuery: {
					clauses: {
						select: nestedFieldNodes.clauses.select,
						from: anyColumnValue.foreignCollection,
						// ...nestedModifiers.clauses,
						joins: joins,
						where: getRelationConditions(anyColumnValue, index, field.nesting),
					},
					parameters: [...parameters, ...fk],
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
