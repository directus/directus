import type { AbstractSqlQueryJsonNode } from '../common/json.js';

export interface AbstractSqlQuerySelectJsonNode extends AbstractSqlQueryJsonNode {
	columnIndex: number;
}
