import type { ParameterizedSQLStatement } from '@directus/data';
import type { SqlStatement } from '@directus/data-sql';

/**
 * Generate the `LIMIT x` part of a SQL statement with an optional `OFFSET y`.
 * If no limit is provided but an offset, the offset gets ignored since an offset is only useful in combination with a limit.
 *
 * @param query - The abstract query
 * @returns The `LIMIT x` part of a SQL statement
 */
export function limit({ limit, offset }: SqlStatement): ParameterizedSQLStatement {
	if (limit === undefined) {
		return {
			statement: '',
			values: [],
		};
	}

	if (offset === undefined) {
		return {
			statement: 'LIMIT ?',
			values: [Number(limit)],
		};
	}

	return {
		statement: 'LIMIT ? OFFSET ?',
		values: [Number(limit), Number(offset)],
	};
}
