import type { AbstractSqlQuery } from '@directus/data-sql';

/**
 * Generate the `LIMIT x` part of a SQL statement.
 *
 * @param query The abstract query
 * @returns The `LIMIT x` part of a SQL statement
 */
export function limit({ limit }: AbstractSqlQuery): string | null {
	if (limit === undefined) {
		return null;
	}

	return `LIMIT $${limit.parameterIndex + 1}`;
}
