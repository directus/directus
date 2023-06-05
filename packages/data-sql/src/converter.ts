import type { AbstractQuery, AbstractQueryFieldNodePrimitive } from '@directus/data/types';
import type { SqlStatement, SqlStatementSelectPrimitive } from './types.js';

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

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const convertPrimitive = (
	abstractPrimitive: AbstractQueryFieldNodePrimitive,
	collection: string
): SqlStatementSelectPrimitive => {
	const statement: SqlStatementSelectPrimitive = {
		type: 'primitive',
		table: collection,
		column: abstractPrimitive.field,
	};

	if (abstractPrimitive.alias) {
		statement.as = abstractPrimitive.alias;
	}

	return statement;
};
