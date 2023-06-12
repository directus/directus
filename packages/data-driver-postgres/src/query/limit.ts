import type { ParameterizedSQLStatement } from '@directus/data';
import type { SqlStatement } from '@directus/data-sql';

/**
 * Generate the `LIMIT x` part of a SQL statement
 * @param query - The abstract query
 */
export function limit({ limit }: SqlStatement): ParameterizedSQLStatement {
	if (limit === undefined) {
		return {
			statement: '',
			values: [],
		};
	}

	return {
		statement: 'LIMIT ?',
		values: [Number(limit)],
	};
}
