import type { SqlStatement } from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generate the `FROM x` part of a SQL statement
 */
export function from(statement: SqlStatement): string {
	return `FROM ${escapeIdentifier(statement.from)}`;
}
