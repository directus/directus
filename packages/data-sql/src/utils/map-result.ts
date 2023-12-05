import type { AliasMapping } from '../types/abstract-sql.js';

export function mapResult(
	aliasMapping: AliasMapping,
	rootRow: Record<string, unknown>,
	subResult: Record<string, unknown>[][],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const aliasObject of aliasMapping) {
		if (aliasObject.type === 'root') {
			result[aliasObject.alias] = rootRow[aliasObject.column];
		} else if (aliasObject.type === 'sub') {
			result[aliasObject.alias] = subResult[aliasObject.index];
		} else {
			result[aliasObject.alias] = mapResult(aliasObject.children, rootRow, subResult);
		}
	}

	return result;
}
