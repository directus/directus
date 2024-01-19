import type { AbstractSqlQuerySelectPrimitiveNode } from '../../types/index.js';

/**
 * @param tableIndex
 * @param field
 * @param columnIndex
 * @returns the converted primitive node
 */
export const createPrimitiveSelect = (
	tableIndex: number,
	columnName: string,
	columnIndex: number,
): AbstractSqlQuerySelectPrimitiveNode => {
	const primitive: AbstractSqlQuerySelectPrimitiveNode = {
		type: 'primitive',
		tableIndex,
		columnName,
		columnIndex,
	};

	return primitive;
};
