import type { AbstractSqlClauses } from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';

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
		switch (o.orderBy.type) {
			case 'primitive':
				return `${escapeIdentifier(o.orderBy.field)} ${o.direction}`;
			case 'fn':
			case 'm2o':
			case 'a2o':
			default:
				throw new Error(`Type ${o.orderBy.type} hasn't been implemented yet`);
		}
	});

	return `ORDER BY ${sortExpressions.join(', ')}`;
}
