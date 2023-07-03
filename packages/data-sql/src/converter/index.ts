import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlQuery } from '../types.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';
import { convertFilter, convertSort } from './modifiers/index.js';
import { convertPrimitive } from './nodes/index.js';

/**
 * @param abstractQuery the abstract query to convert
 * @returns a format very close to actual SQL but without making assumptions about the actual SQL dialect
 */
export const convertAbstractQueryToAbstractSqlQuery = (abstractQuery: AbstractQuery): AbstractSqlQuery => {
	const statement: AbstractSqlQuery = {
		select: abstractQuery.nodes.map((abstractNode) => {
			switch (abstractNode.type) {
				case 'primitive':
					return convertPrimitive(abstractNode, abstractQuery.collection);
				case 'fn':
				case 'm2o':
				case 'o2m':
				case 'a2o':
				case 'o2a':
				default:
					throw new Error(`Abstract Query node type ${abstractNode.type} is not supported`);
			}
		}),
		from: abstractQuery.collection,
		parameters: [],

		aliases: new Map(),
		paths: new Map()
	};

	const idGen = parameterIndexGenerator();

	if (abstractQuery.modifiers?.filter) {
		const convertedFilter = convertFilter(abstractQuery.modifiers.filter, abstractQuery.collection, idGen);

		statement.where = convertedFilter.where;
		statement.parameters.push(...convertedFilter.parameters);
	}

	// TODO: Create a generic function for this and add unit tests. This way we might can save some tests in index.test.ts

	if (abstractQuery.modifiers?.limit) {
		statement.limit = { parameterIndex: idGen.next().value };
		statement.parameters.push(abstractQuery.modifiers.limit.value);
	}

	if (abstractQuery.modifiers?.offset) {
		statement.offset = { parameterIndex: idGen.next().value };
		statement.parameters.push(abstractQuery.modifiers.offset.value);
	}

	if (abstractQuery.modifiers?.sort) {
		statement.order = convertSort(abstractQuery.modifiers.sort);
	}

	return statement;
};
