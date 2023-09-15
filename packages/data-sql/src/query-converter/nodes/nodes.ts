import type { AbstractQueryFieldNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../types/index.js';
import { createPrimitiveSelect } from './create-primitive-select.js';
import { createJoin } from './create-join.js';
import { convertFn } from '../functions.js';
import { createUniqueIdentifier } from './create-unique-identifier.js';

export type ConvertSelectOutput = Pick<AbstractSqlQuery, 'select' | 'joins' | 'parameters'>;

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
export const convertNodesAndGenerateAliases = (
	collection: string,
	abstractFields: AbstractQueryFieldNode[],
	idxGenerator: Generator<number, number, number>,
	currentPath: string[] = []
): { sql: ConvertSelectOutput; aliasMapping: Map<string, string[]> } => {
	const select: ConvertSelectOutput['select'] = [];
	const joins: ConvertSelectOutput['joins'] = [];
	const parameters: AbstractSqlQuery['parameters'] = [];
	const aliasRelationalMapping: Map<string, string[]> = new Map();

	for (const abstractField of abstractFields) {
		if (abstractField.type === 'primitive') {
			// ORM aliasing and mapping
			const generatedAlias = createUniqueIdentifier(abstractField.field);
			aliasRelationalMapping.set(generatedAlias, [...currentPath, abstractField.alias ?? abstractField.field]);

			// query conversion
			const selectNode = createPrimitiveSelect(collection, abstractField, generatedAlias);
			select.push(selectNode);
			continue;
		}

		if (abstractField.type === 'm2o') {
			/**
			 * Always fetch the current context foreign key as well. We need it to check if the current
			 * item has a related item so we don't expand `null` values in a nested object where every
			 * value is null
			 *
			 * @TODO
			 */

			const m2oField = abstractField;
			const externalCollectionAlias = createUniqueIdentifier(m2oField.join.external.collection);
			const sqlJoinNode = createJoin(collection, m2oField, externalCollectionAlias);

			const nestedOutput = convertNodesAndGenerateAliases(externalCollectionAlias, abstractField.nodes, idxGenerator, [
				...currentPath,
				abstractField.join.external.collection,
			]);

			nestedOutput.aliasMapping.forEach((value, key) => aliasRelationalMapping.set(key, value));
			joins.push(sqlJoinNode);
			select.push(...nestedOutput.sql.select);
			continue;
		}

		if (abstractField.type === 'fn') {
			const fnField = abstractField;

			// ORM aliasing and mapping
			const generatedAlias = createUniqueIdentifier(`${fnField.fn.fn}_${fnField.field}`);
			aliasRelationalMapping.set(generatedAlias, [...currentPath, abstractField.alias ?? abstractField.field]);

			// query conversion
			const fn = convertFn(collection, fnField, idxGenerator, generatedAlias);
			select.push(fn.fn);
			parameters.push(...fn.parameters);
			continue;
		}
	}

	return { sql: { select, joins, parameters }, aliasMapping: aliasRelationalMapping };
};
