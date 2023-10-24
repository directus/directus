import type { AbstractSqlClauses } from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generate the `FROM x` part of a SQL statement
 * @param from - The table to select data from
 * @returns The `FROM x` part of a SQL statement
 */
export function from({ from }: AbstractSqlClauses): string {
	return `FROM ${escapeIdentifier(from)}`;
}
