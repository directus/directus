import type { AbstractSqlQueryPrimitiveNode } from '../common/primitive.js';

/**
 * Used to select a specific column from a table.
 */
export interface AbstractSqlQuerySelectPrimitiveNode extends AbstractSqlQueryPrimitiveNode {
	as: string;
}
