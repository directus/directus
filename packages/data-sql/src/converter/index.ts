import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlQuery } from '../types.js';
import { convertPrimitive } from './convert-primitive.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';

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
					throw new Error(`Type ${abstractNode.type} hasn't been implemented yet`);
			}
		}),
		from: abstractQuery.collection,
		parameters: [],
	};

	const idGen = parameterIndexGenerator();

	// TODO:
	// The next functions look very similar.
	// Depending on how the other conversions will look like, we can introduce a generic function for this.

	if (abstractQuery.modifiers?.limit) {
		const idx = idGen.next().value;
		statement.limit = { parameterIndex: idx };
		statement.parameters[idx] = abstractQuery.modifiers.limit.value;
	}

	if (abstractQuery.modifiers?.offset) {
		const idx = idGen.next().value;
		statement.offset = { parameterIndex: idx };
		statement.parameters[idx] = abstractQuery.modifiers.offset.value;
	}

	return statement;
};
