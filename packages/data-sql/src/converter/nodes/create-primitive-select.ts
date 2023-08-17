import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { AbstractSqlQuerySelectNode } from '../../types/index.js';
import { createUniqueIdentifier } from './create-unique-identifier.js';

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const createPrimitiveSelect = (
	collection: string,
	abstractPrimitive: AbstractQueryFieldNodePrimitive
): Required<AbstractSqlQuerySelectNode> => {
	return {
		type: 'primitive',
		table: collection,
		column: abstractPrimitive.field,
		as: createUniqueIdentifier(abstractPrimitive.field),
	};
};
