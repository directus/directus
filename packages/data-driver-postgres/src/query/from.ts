import type { AbstractSqlClauses } from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';
import { tableIndexToIdentifier } from '../utils/index-to-identifier.js';

/**
 * Generate the `FROM x` part of a SQL statement.
 *
 * @param query - The whole abstract SQL query
 * @returns The `FROM x` part of a SQL statement
 */
export function from({ from }: AbstractSqlClauses): string {
	const tableAlias = tableIndexToIdentifier(from.tableIndex);
	return `FROM ${escapeIdentifier(from.tableName)} AS ${escapeIdentifier(tableAlias)}`;
}
