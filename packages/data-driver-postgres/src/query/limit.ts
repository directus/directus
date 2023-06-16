import type { SqlStatement } from '@directus/data-sql';

/**
 * Generate the `LIMIT x` part of a SQL statement.
 *
 * @param query - The abstract query
 * @returns The `LIMIT x` part of a SQL statement
 */
export function limit({ limit }: SqlStatement): string {
	if (limit === undefined) {
		return '';
	}

	return `LIMIT $${limit + 1}`;
}
