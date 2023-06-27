import type { AbstractQuery } from '@directus/data';
import type { AbstractSqlQuery } from '../types.js';
import { convertPrimitive } from './convert-primitive.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';
import { convertSort } from './convert-sort.js';
import { convertFilter } from './convert-filter.js';

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

	if (abstractQuery.modifiers?.filter) {
		const idx = idGen.next().value;

		if (abstractQuery.modifiers.filter.type === 'logical') {
			throw new Error('Logical operators are not supported yet');
		}

		// for those two operators a second parameter is needed
		let secondIndex = null;

		if (['between', 'in'].includes(abstractQuery.modifiers.filter.operation!)) {
			secondIndex = idGen.next().value;
		}

		const convertedFilter = convertFilter(abstractQuery.modifiers.filter, abstractQuery.collection, idx, secondIndex);

		if (convertedFilter !== null) {
			statement.where = convertedFilter.where;
			statement.parameters[idx] = convertedFilter.parameters[0]!;

			if (secondIndex) {
				statement.parameters[secondIndex] = convertedFilter.parameters[1]!;
			}
		}
	}

	// TODO: Create a generic function for this and add unit tests. This way we might can save some tests in index.test.ts

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

	if (abstractQuery.modifiers?.sort) {
		statement.order = convertSort(abstractQuery.modifiers.sort);
	}

	return statement;
};
