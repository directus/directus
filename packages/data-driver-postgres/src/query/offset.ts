import type { AbstractSqlClauses } from '@directus/data-sql';

/**
 * Generate the `OFFSET x` part of a SQL statement.
 *
 * @param query The abstract query
 * @returns The `OFFSET x` part of a SQL statement
 */
export function offset({ offset }: AbstractSqlClauses): string | null {
	if (offset === undefined) {
		return null;
	}

	return `OFFSET $${offset.parameterIndex + 1}`;
}
