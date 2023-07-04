import { escapeIdentifier } from './escape-identifier.js';

/**
 * Adds the table name to the column and escapes the identifiers.
 *
 * @param table
 * @param column
 * @param as
 * @returns the selection for the primitive field
 */
export function wrapColumn(table: string, column: string, as?: string): string {
	let base = `${escapeIdentifier(table)}.${escapeIdentifier(column)}`;

	if (as) {
		base += ` AS ${escapeIdentifier(as)}`;
	}

	return base;
}
