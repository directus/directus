import type { AbstractQueryFieldNode, AtLeastOneElement } from '@directus/data';
import type { AbstractSqlClauses, AliasMapping, ParameterTypes, SubQuery } from '../../types/index.js';
import { type IndexGenerators } from '../utils/create-index-generators.js';
import { convertFieldFn } from './nodes/function.js';
import { createJoin } from './nodes/join.js';
import { convertJson } from './nodes/json-select.js';
import { getNestedMany } from './nodes/nested-manys.js';
import { createPrimitiveSelect } from './nodes/primitive-select.js';

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
 * @param abstractFields - all nodes from the abstract query
 * @param tableIndex - the index to the table the field nodes belong to
 * @param indexGen - the generator used to increase the parameter indices
 * @returns Select, join and parameters
 */
export const convertFieldNodes = (
	abstractFields: AbstractQueryFieldNode[],
	tableIndex: number,
	indexGen: IndexGenerators,
	objectPath: AtLeastOneElement<string> | null = null,
): FieldConversionResult => {
	const select: AbstractSqlClauses['select'] = [];
	const joins: AbstractSqlClauses['joins'] = [];
	const parameters: ParameterTypes[] = [];
	const aliasMapping: AliasMapping = [];
	const subQueries: SubQuery[] = [];

	for (const abstractField of abstractFields) {
		if (abstractField.type === 'primitive') {
			const columnIndex = indexGen.column.next().value;

			if (objectPath !== null) {
				const newObjectPath: AtLeastOneElement<string> = [...objectPath, abstractField.field];

				const conversionResult = convertJson(tableIndex, newObjectPath, columnIndex, indexGen);

				select.push(conversionResult.jsonNode);
				parameters.push(...conversionResult.parameters);
			} else {
				const selectNode = createPrimitiveSelect(tableIndex, abstractField.field, columnIndex);

				select.push(selectNode);
			}

			aliasMapping.push({ type: 'root', alias: abstractField.alias, columnIndex });
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

			if (abstractField.nesting.type === 'relational-single') {
				const tableIndexRelational = indexGen.table.next().value;

				const sqlJoinNode = createJoin(abstractField.nesting, tableIndex, tableIndexRelational);

				const nestedOutput = convertFieldNodes(abstractField.fields, tableIndexRelational, indexGen);

				aliasMapping.push({ type: 'nested', alias: abstractField.alias, children: nestedOutput.aliasMapping });
				joins.push(sqlJoinNode);
				select.push(...nestedOutput.clauses.select);
			}

			if (abstractField.nesting.type === 'object-single') {
				const newObjectPath: AtLeastOneElement<string> = [...(objectPath ?? []), abstractField.nesting.fieldName];

				const nestedOutput = convertFieldNodes(abstractField.fields, tableIndex, indexGen, newObjectPath);

				aliasMapping.push({ type: 'nested', alias: abstractField.alias, children: nestedOutput.aliasMapping });
				select.push(...nestedOutput.clauses.select);
				joins.push(...nestedOutput.clauses.joins);
				subQueries.push(...nestedOutput.subQueries);
				parameters.push(...nestedOutput.parameters);
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

			const nestedManyResult = getNestedMany(abstractField, tableIndex);

			aliasMapping.push({ type: 'sub', alias: abstractField.alias, index: subQueries.length });
			subQueries.push(nestedManyResult.subQuery);
			select.push(...nestedManyResult.select);

			continue;
		}

		if (abstractField.type === 'fn') {
			const columnIndex = indexGen.column.next().value;

			const fn = convertFieldFn(tableIndex, abstractField, columnIndex, indexGen);

			aliasMapping.push({ type: 'root', alias: abstractField.alias, columnIndex });
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
