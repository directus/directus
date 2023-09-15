import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { AbstractSqlQuerySelectNode } from '../../types/index.js';

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const createPrimitiveSelect = (
	collection: string,
	abstractPrimitive: AbstractQueryFieldNodePrimitive,
	generatedAlias: string
): AbstractSqlQuerySelectNode => {
	const primitive: AbstractSqlQuerySelectNode = {
		type: 'primitive',
		table: collection,
		column: abstractPrimitive.field,
		as: generatedAlias,
	};

	if (abstractPrimitive.alias) {
		primitive.alias = abstractPrimitive.alias;
	}

	return primitive;
};
