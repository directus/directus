import { escapeIdentifier } from '../../utils.js';

/**
 * Generate the `FROM x` part of a SQL statement
 * @param table - String identifier of the table to query against
 */
export function from(table: string): string {
	return `FROM ${escapeIdentifier(table)}`;
}
