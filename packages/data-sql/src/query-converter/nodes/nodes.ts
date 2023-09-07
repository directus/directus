import type { AbstractQueryFieldNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../types/index.js';
import { createUniqueIdentifier } from './create-unique-identifier.js';
import { createPrimitiveSelect } from './create-primitive-select.js';
import { createJoin } from './create-join.js';
import { convertFn } from './functions.js';

export type ConvertSelectOutput = Pick<AbstractSqlQuery, 'select' | 'joins' | 'parameters'>;

/**
 * Splits up the nodes into the different parts of the query.
 * Any primitive nodes and function nodes will be added to the list of selects.
 * Any m2o node will be added to the list of joins, but the field will also be added to the list of selects.
 *
 * Each select node will get an auto generated alias. This alias will be used later on to convert the response to a nested object.
 *
 * @param collection - the current collection, will be an alias when called recursively
 * @param abstractFields - all nodes from the abstract query
 * @param idxGenerator - the generator used to increase the parameter indices
 * @returns Select, join and parameters
 */
export const convertNodes = (
	collection: string,
	abstractFields: AbstractQueryFieldNode[],
	idxGenerator: Generator<number, number, number>
): ConvertSelectOutput => {
	const select: ConvertSelectOutput['select'] = [];
	const joins: ConvertSelectOutput['joins'] = [];
	const parameters: AbstractSqlQuery['parameters'] = [];

	for (const abstractField of abstractFields) {
		if (abstractField.type === 'primitive') {
			const selectNode = createPrimitiveSelect(collection, abstractField);
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
			joins.push(sqlJoinNode);
			const nestedOutput = convertNodes(externalCollectionAlias, m2oField.nodes, idxGenerator);
			select.push(...nestedOutput.select);
			continue;
		}

		if (abstractField.type === 'fn') {
			const fnField = abstractField;
			const id = createUniqueIdentifier(fnField.fn);
			const fn = convertFn(collection, fnField, idxGenerator, id);
			select.push(fn.fn);
			parameters.push(...fn.parameters);
			continue;
		}

		throw new Error(`Node type ${abstractField.type} is not supported`);
	}

	return { select, joins, parameters };
};
