import type { AbstractQueryFieldNode, AbstractQueryFieldNodeNestedMany } from '@directus/data';
import type { AbstractSqlClauses, AbstractSqlNestedMany, AbstractSqlQuery, ParameterTypes } from '../../types/index.js';
import { createPrimitiveSelect } from './create-primitive-select.js';
import { createJoin } from './create-join.js';
import { convertFn } from '../functions.js';
import { createUniqueAlias } from '../../orm/create-unique-alias.js';

export type Result = {
	clauses: Pick<AbstractSqlClauses, 'select' | 'joins'>;
	parameters: AbstractSqlQuery['parameters'];
	aliasMapping: AbstractSqlQuery['aliasMapping'];
	nestedManys: AbstractSqlNestedMany[];
};

/**
 * Converts nodes into the abstract sql clauses.
 * Any primitive nodes and function nodes will be added to the list of selects.
 * Any m2o node will be added to the list of joins and the desired column will also be added to the list of selects.
 *
 * Also some preparation work is done here regarding the ORM.
 * For this, each select node and the joined tables will get an auto generated alias.
 * While iterating over the nodes, the mapping of the auto generated alias to the original (related) field is created and returned separately.
 * This map of aliases to the relational "path" will be used later on to convert the response to a nested object - the second part of the ORM.
 *
 * @param collection - the current collection, will be an alias when called recursively
 * @param abstractFields - all nodes from the abstract query
 * @param idxGenerator - the generator used to increase the parameter indices
 * @param currentPath - the path which the recursion made for the ORM map
 * @returns Select, join and parameters
 */
export const convertFieldNodes = (
	collection: string,
	abstractFields: AbstractQueryFieldNode[],
	idxGenerator: Generator<number, number, number>,
	currentPath: string[] = []
): Result => {
	const select: AbstractSqlClauses['select'] = [];
	const joins: AbstractSqlClauses['joins'] = [];
	const parameters: ParameterTypes[] = [];
	const aliasRelationalMapping: Map<string, string[]> = new Map();
	const nestedManys: AbstractSqlNestedMany[] = [];

	for (const abstractField of abstractFields) {
		if (abstractField.type === 'primitive') {
			// ORM aliasing and mapping
			const generatedAlias = createUniqueAlias(abstractField.field);
			aliasRelationalMapping.set(generatedAlias, [...currentPath, abstractField.alias ?? abstractField.field]);

			// query conversion
			const selectNode = createPrimitiveSelect(collection, abstractField, generatedAlias);
			select.push(selectNode);
			continue;
		}

		if (abstractField.type === 'nested-one') {
			/**
			 * Always fetch the current context foreign key as well. We need it to check if the current
			 * item has a related item so we don't expand `null` values in a nested object where every
			 * value is null
			 *
			 * @TODO
			 */

			if (abstractField.meta.type === 'm2o') {
				const externalCollectionAlias = createUniqueAlias(abstractField.meta.join.external.collection);
				const sqlJoinNode = createJoin(collection, abstractField.meta, externalCollectionAlias, abstractField.alias);

				const nestedOutput = convertFieldNodes(externalCollectionAlias, abstractField.fields, idxGenerator, [
					...currentPath,
					abstractField.meta.join.external.collection,
				]);

				nestedOutput.aliasMapping.forEach((value, key) => aliasRelationalMapping.set(key, value));
				joins.push(sqlJoinNode);
				select.push(...nestedOutput.clauses.select);
			}

			continue;
		}

		if (abstractField.type === 'nested-many') {
			/*
			 * nested many nodes are handled by the driver,
			 * because the most performant technique to use here depends on the vendor.
			 * some prefer a sub query in the statement, some a join and some prefer multiple separate queries.
			 * That's why we don't do anything with nested many nodes here but instead just forward them to the driver.
			 */

			const fieldMeta = abstractField.meta;

			if (fieldMeta.type === 'o2m') {
				const externalCollectionAlias = createUniqueAlias(fieldMeta.join.external.collection);

				const nestedOutput = convertFieldNodes(externalCollectionAlias, abstractField.fields, idxGenerator, [
					...currentPath,
					fieldMeta.join.external.collection,
				]);

				nestedManys.push({
					queryGenerator: (fields) => ({
						clauses: {
							select: nestedOutput.clauses.select,
							from: fieldMeta.join.external.collection,
							where: {
								type: 'logical',
								operator: 'and',
								negate: false,
								childNodes: fieldMeta.join.current.fields.map((field) => ({
									type: 'condition',
									condition: {
										type: 'condition-string',
										operation: 'eq',
										target: {
											type: 'primitive',
											table: fieldMeta.join.external.collection,
											column: field,
										},
										compareTo: {
											type: 'value',
											parameterIndex: idxGenerator.next().value,
										},
									},
									negate: false,
								})),
							},
						},
						parameters: [...nestedOutput.parameters, ...fields],
						aliasMapping: nestedOutput.aliasMapping,
						nestedManys: nestedOutput.nestedManys,
					}),
					alias: externalCollectionAlias,
				});
			}
		}

		if (abstractField.type === 'fn') {
			const fnField = abstractField;

			// ORM aliasing and mapping
			const generatedAlias = createUniqueAlias(`${fnField.fn.fn}_${fnField.field}`);
			aliasRelationalMapping.set(generatedAlias, [...currentPath, abstractField.alias ?? abstractField.field]);

			// query conversion
			const fn = convertFn(collection, fnField, idxGenerator, generatedAlias);
			select.push(fn.fn);
			parameters.push(...fn.parameters);
			continue;
		}
	}

	return { clauses: { select, joins }, parameters, aliasMapping: aliasRelationalMapping, nestedManys };
};
