import type { AbstractQueryFieldNode } from '@directus/data';
import { createUniqueAlias } from '../../utils/create-unique-alias.js';
import type { AbstractSqlClauses, AliasMapping, ParameterTypes, SubQuery } from '../../types/index.js';
import { convertFn } from '../functions.js';
import { createJoin } from './create-join.js';
import { getNestedMany } from './create-nested-manys.js';
import { createPrimitiveSelect } from './create-primitive-select.js';

export type FieldConversionResult = {
	clauses: Required<Pick<AbstractSqlClauses, 'select' | 'joins'>>;
	parameters: ParameterTypes[];
	aliasMapping: AliasMapping;
	subQueries: SubQuery[];
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
): FieldConversionResult => {
	const select: AbstractSqlClauses['select'] = [];
	const joins: AbstractSqlClauses['joins'] = [];
	const parameters: ParameterTypes[] = [];
	const aliasMapping: AliasMapping = [];
	const subQueries: SubQuery[] = [];

	for (const abstractField of abstractFields) {
		if (abstractField.type === 'primitive') {
			// ORM aliasing and mapping
			const generatedAlias = createUniqueAlias(abstractField.field);

			aliasMapping.push({ type: 'root', alias: abstractField.alias, column: generatedAlias });

			// query conversion
			const selectNode = createPrimitiveSelect(collection, abstractField.field, generatedAlias);
			select.push(selectNode);

			continue;
		}

		if (abstractField.type === 'nested-single-one') {
			/**
			 * Always fetch the current context foreign key as well. We need it to check if the current
			 * item has a related item so we don't expand `null` values in a nested object where every
			 * value is null
			 *
			 * @TODO
			 */

			if (abstractField.nesting.type === 'relational-many') {
				const externalCollectionAlias = createUniqueAlias(abstractField.nesting.foreign.collection);
				const sqlJoinNode = createJoin(collection, abstractField.nesting, externalCollectionAlias);

				const nestedOutput = convertFieldNodes(externalCollectionAlias, abstractField.fields, idxGenerator);

				aliasMapping.push({ type: 'nested', alias: abstractField.alias, children: nestedOutput.aliasMapping });

				joins.push(sqlJoinNode);
				select.push(...nestedOutput.clauses.select);
			}

			continue;
		}

		if (abstractField.type === 'nested-union-one') {
			// @TODO convert node into a root query and a query in form of of a function which has the collection relation as parameters

			continue;
		}

		if (abstractField.type === 'nested-single-many') {
			/*
			 * nested many nodes are handled by the driver.
			 * As a default behavior, we do separate queries for each o part result row.
			 * The driver itself can use different technique if another technique is more performant,
			 * like do a sub query in the statement or a join.
			 */

			const nestedManyResult = getNestedMany(collection, abstractField);

			aliasMapping.push({ type: 'sub', alias: abstractField.alias, index: subQueries.length });

			subQueries.push(nestedManyResult.subQuery);
			select.push(...nestedManyResult.select);

			continue;
		}

		if (abstractField.type === 'fn') {
			const fnField = abstractField;

			// ORM aliasing and mapping
			const generatedAlias = createUniqueAlias(`${fnField.fn.fn}_${fnField.field}`);

			aliasMapping.push({ type: 'root', alias: abstractField.alias, column: generatedAlias });

			// query conversion
			const fn = convertFn(collection, fnField, idxGenerator, generatedAlias);
			select.push(fn.fn);
			parameters.push(...fn.parameters);

			continue;
		}
	}

	return {
		clauses: { select, joins },
		subQueries,
		parameters,
		aliasMapping,
	};
};
