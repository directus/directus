import { tableIndexToIdentifier, type AbstractSqlClauses } from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';
import { applyFunction } from '../utils/functions.js';
import { applyJsonPathAsObject } from '../utils/json-path.js';
import { wrapColumn } from '../utils/wrap-column.js';

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
		if (o.orderBy.type === 'fn') {
			return `${applyFunction(o.orderBy)} ${o.direction}`;
		} else if (o.orderBy.type === 'json') {
			const tableAlias = tableIndexToIdentifier(o.orderBy.tableIndex);
			const column = wrapColumn(tableAlias, o.orderBy.columnName);

			return `${applyJsonPathAsObject(column, o.orderBy.path)} ${o.direction}`;
		} else {
			const tableAlias = tableIndexToIdentifier(o.orderBy.tableIndex);

			return `${escapeIdentifier(tableAlias)}.${escapeIdentifier(o.orderBy.columnName)} ${o.direction}`;
		}
	});

	return `ORDER BY ${sortExpressions.join(', ')}`;
}
