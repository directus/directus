import type { SqlStatement } from '@directus/data-sql';

/**
 * Generate the `OFFSET x` part of a SQL statement.
 *
 * @param query The abstract query
 * @returns The `OFFSET x` part of a SQL statement
 */
export function offset({ offset }: SqlStatement): string {
	if (offset === undefined) {
		return '';
	}

	return `OFFSET $${offset.parameterIndex + 1}`;
}
