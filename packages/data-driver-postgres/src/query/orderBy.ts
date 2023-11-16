import type { AbstractSqlClauses } from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';
import { applyFunction } from '../utils/functions.js';

/**
 * Generates the `ORDER BY x` part of a SQL statement.
 * The order direction is always set explicitly, although Postgres defaults to `ASC`.
 *
 * @param query - The abstract query
 * @returns The `ORDER BY x` part of a SQL statement
 */
export function orderBy({ order }: AbstractSqlClauses): string | null {
	if (order === undefined) {
		return null;
	}

	const sortExpressions = order.map((o) => {
		if (o.orderBy.type === 'primitive') {
			return `${escapeIdentifier(o.orderBy.table)}.${escapeIdentifier(o.orderBy.column)} ${o.direction}`;
		} else {
			return `${applyFunction(o.orderBy)} ${o.direction}`;
		}
	});

	return `ORDER BY ${sortExpressions.join(', ')}`;
}
