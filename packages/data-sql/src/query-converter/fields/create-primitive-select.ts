import type { AbstractSqlQuerySelectNode } from '../../types/index.js';

/**
 * @param abstractPrimitive
 * @param collection
 * @returns the converted primitive node
 */
export const createPrimitiveSelect = (
	collection: string,
	field: string,
	generatedAlias: string,
): AbstractSqlQuerySelectNode => {
	const primitive: AbstractSqlQuerySelectNode = {
		type: 'primitive',
		table: collection,
		column: field,
		as: generatedAlias,
	};

	return primitive;
};
