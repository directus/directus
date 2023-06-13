import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { SqlStatementSelectPrimitive } from '../types.js';

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
