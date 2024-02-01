import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';

export function convertJson(
	path: string[],
	tableIndex: number,
	columnName: string,
	columnIndex: number,
): AbstractSqlQuerySelectJsonNode {
	return {
		type: 'json',
		tableIndex,
		path,
		columnName,
		columnIndex,
	};
}
