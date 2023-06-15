import type { SqlStatement } from '@directus/data-sql';

/**
 * Generate the `LIMIT x` part of a SQL statement with an optional `OFFSET y`.
 * If no limit is provided but an offset, the offset gets ignored since an offset is only useful in combination with a limit.
 *
 * @param query - The abstract query
 * @returns The `LIMIT x` part of a SQL statement
 */
export function limitOffset({ limit, offset }: SqlStatement): string {
	if (limit === undefined) {
		return '';
	}

	if (offset === undefined) {
		return `LIMIT $${limit + 1}`;
	}

	return `LIMIT $${limit + 1} OFFSET $${offset + 1}`.trim();
}
