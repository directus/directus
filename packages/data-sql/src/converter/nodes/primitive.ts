import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { SqlStatementSelectColumn } from '../../types.js';

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const convertPrimitive = (
	abstractPrimitive: AbstractQueryFieldNodePrimitive,
	collection: string
): SqlStatementSelectColumn => {
	const statement: SqlStatementSelectColumn = {
		type: 'primitive',
		table: collection,
		column: abstractPrimitive.field,
	};

	if (abstractPrimitive.alias) {
		statement.as = abstractPrimitive.alias;
	}

	return statement;
};
