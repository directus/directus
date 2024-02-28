import { type AbstractSqlClauses } from '@directus/data-sql';
import { convertTarget } from '../utils/convert-target.js';

/**
 * Generates the `ORDER BY x` part of a SQL statement.
 * The order direction is always set explicitly, although Postgres defaults to `ASC`.
 *
 * @param query - The whole abstract SQL query
 * @returns The `ORDER BY x` part of a SQL statement
 */
export function orderBy({ order }: AbstractSqlClauses): string | null {
	if (order === undefined) {
		return null;
	}

	const sortExpressions = order.map((o) => {
		const target = convertTarget(o.orderBy, 'object');
		return `${target} ${o.direction}`;
	});

	return `ORDER BY ${sortExpressions.join(', ')}`;
}
