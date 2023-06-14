import type { AbstractQuery } from '@directus/data';
import type { SqlStatement } from '../types.js';
import { convertPrimitive } from './convert-primitive.js';

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

	return statement;
};

/**
 * Generator function to generate parameter indices.
 */
function* parameterIndexGenerator() {
	let index = 0;

	while (true) {
		yield index++;
	}
}
