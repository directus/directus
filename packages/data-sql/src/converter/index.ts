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
	};

	return statement;
};
