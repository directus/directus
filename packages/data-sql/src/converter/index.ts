import type { AbstractQuery } from '@directus/data';
import type { SqlStatement } from '../types.js';
import { convertPrimitive } from './convert-primitive.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';
import { convertSort } from './convert-sort.js';

/**
 * @param abstractQuery the abstract query to convert
 * @returns a format very close to actual SQL but without making assumptions about the actual SQL dialect
 */
export const convertAbstractQueryToSqlStatement = (abstractQuery: AbstractQuery): SqlStatement => {
	const statement: SqlStatement = {
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
					throw new Error(`Type ${abstractNode.type} hasn't been implemented yet`);
			}
		}),
		from: abstractQuery.collection,
		parameters: [],
	};

	const idGen = parameterIndexGenerator();

	// The next functions look very similar.
	// Depending on how the other conversions will look like, we can introduce a generic function for this.

	if (abstractQuery.modifiers?.limit) {
		const idx = idGen.next().value as number;
		statement.limit = idx + 1;
		statement.parameters[idx] = abstractQuery.modifiers.limit.value;
	}

	if (abstractQuery.modifiers?.offset) {
		const idx = idGen.next().value as number;
		statement.offset = idx + 1;
		statement.parameters[idx] = abstractQuery.modifiers.offset.value;
	}

	if (abstractQuery.modifiers?.sort) {
		const { orderBy, order, parameters } = convertSort(abstractQuery.modifiers.sort);
		statement.orderBy = orderBy;
		statement.order = order;
		// @ts-ignore
		statement.parameters[orderBy] = parameters[0];
	}

	return statement;
};
